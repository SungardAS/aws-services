'use strict';

/**********************************************************************************************
* This scripts requires the following environment variables (some of them encrypted using KMS)
*   - MYSQL_USER (encrypted)
*   - MYSQL_PASSWORD (encrypted)
*   - MYSQL_DB_INSTANCE
*   - MYSQL_DB_NAME
*   - MASTER_AWS_ACCOUNT
*   - QRY_VPC_ID (encrypted)
*   - QRY_OS_ID (encrypted)
*   - QRY_INS_VOL (encrypted)
*   - QRY_INS_OS (encrypted)
*   - QRY_UPDT_OS (encrypted)
*
**********************************************************************************************/
const aws = require('aws-sdk');
const mysql = require('mysql');
const uuid = require('node-uuid');
const util = require('util');

const config = new aws.ConfigService();
const ec2 = new aws.EC2();

function getCustomerCredentials(invokingEvent, ruleParameters, callback) {
    var master_account = process.env.MASTER_AWS_ACCOUNT;
    var sts = new aws.STS();
    sts.assumeRole({
        RoleArn: `arn:aws:iam::${master_account}:role/federate`,
        RoleSessionName: "auth"
    }, function(err, data){
        if (err) {
            callback(err, null);
        } else {
            var creds = new aws.Credentials({
                accessKeyId: data.Credentials.AccessKeyId,
                secretAccessKey: data.Credentials.SecretAccessKey,
                sessionToken: data.Credentials.SessionToken
            });

            checkDefined(invokingEvent.configurationItem.awsAccountId, 'awsAccountId');
            checkDefined(ruleParameters.TrustRole, 'TrustRole');
            var customer_account = invokingEvent.configurationItem.awsAccountId;
            var customer_role = ruleParameters.TrustRole;
            var nextSTS = new aws.STS({credentials: creds});
            var nextOpts = {
              RoleArn: `arn:aws:iam::${customer_account}:role/${customer_role}`,
              RoleSessionName: "auth"
            };
            var external_id = ruleParameters.ExternalId;
            if (external_id !== undefined && external_id.trim() !== '') {
                nextOpts.ExternalId = external_id;
            } else {
                console.log("No external id provided. Continuing without external id...");
            }
            nextSTS.assumeRole(nextOpts, function(err, data){
                if(err){
                    callback(err, null);
                } else {
                    var customer_creds = new aws.Credentials({
                        accessKeyId: data.Credentials.AccessKeyId,
                        secretAccessKey: data.Credentials.SecretAccessKey,
                        sessionToken: data.Credentials.SessionToken
                    });
                    callback (null, customer_creds);
                }
            });
        }
    });
}

function getVpcStackName(invokingEvent, ruleParameters, callback) {
    getCustomerCredentials(invokingEvent, ruleParameters, function(err, customer_creds) {
        if (!err) {
            checkDefined(invokingEvent.configurationItem.awsRegion, 'awsRegion');
            var customer_region = invokingEvent.configurationItem.awsRegion;
            var ec2 = new aws.EC2({region: customer_region, credentials: customer_creds});
            checkDefined(invokingEvent.configurationItem.configuration.vpcId, 'vpcId');
            var vpcid = invokingEvent.configurationItem.configuration.vpcId;
            var params = {
                VpcIds: [
                    vpcid
                ]
            };
            ec2.describeVpcs(params, function(err, data){
                if(err){
                    callback(err, null);
                } else {
                    var vpcStackName = data.Vpcs[0].Tags.filter(stacknameTag)[0].Value.split('-').slice(0, -2).join('-');
                    console.log(`Returning vpcStackName: ${vpcStackName}`);
                    callback(null, vpcStackName);
                }
            });
        } else {
            callback(err, null);
        }
    });
}

function decryptData(encrypted_data, callback) {

    var params = {
        CiphertextBlob: new Buffer(encrypted_data, 'base64')
    };

    var kms = new aws.KMS();
    kms.decrypt(params, function(err, data) {
        if (!err) {
            callback(null, data.Plaintext.toString('ascii'));
        } else {
            callback(err, null);
        }
    });
}

function connectDB(callback) {
    const dbhostname = process.env.MYSQL_DB_INSTANCE;
    const dbport = 3306;
    const dbname = process.env.MYSQL_DB_NAME;
    var encrypted_dbuser = process.env.MYSQL_USER;
    var encrypted_dbpassword = process.env.MYSQL_PASSWORD;
    decryptData(encrypted_dbuser, function(err, dbuser){
        if (!err) {
            decryptData(encrypted_dbpassword, function(err, dbpassword){
                if(!err) {
                    var connection = mysql.createConnection({
                        host: dbhostname,
                        port: dbport,
                        user: dbuser,
                        password: dbpassword,
                        database: dbname
                    });
                    connection.connect(function (error) {
                        if (error) {
                            console.log(`Got an error while connection establishment: ${error}`);
                            callback(error, null);
                        }
                    });
                    console.log("Database Connection Extblished");
                    callback(null, connection);
                } else {
                    callback(err, "Failed to decrypt dbpassword");
                }
            });
        } else {
            callback(err, "Failed to decrypt dbuser");
        }
    });
}

// Filter function to get stackname tag
function stacknameTag(tag) {
    return tag.Key === 'aws:cloudformation:stack-name';
}


// Get database id for managed vpc
function getVpcDatabaseId(vpc_stackname, callback) {

    // Connect to database
    connectDB(function(err, connection){
        if (!err) {
            var encrypted_qry_vpc_id = process.env.QRY_VPC_ID;
            decryptData(encrypted_qry_vpc_id, function(err, qry_vpc_id) {
                if (!err) {
                    var queryStr = util.format(qry_vpc_id, vpc_stackname);
                    connection.query(queryStr, function (err, result) {
                        connection.end();
                        if(!err) {
                            var dvpc_id = result[0].id;
                            callback(null, dvpc_id);
                        } else {
                            callback(`Error while perfoming query! ${err}`, null);
                        }
                    });
                } else {
                    console.log(err);
                    callback(err, null);
                }
            });
        } else {
            callback(err, null);
        }
    });
}

// Helper function used to validate input
function checkDefined(reference, referenceName) {
    if (!reference) {
        console.log(`Error: ${referenceName} is not defined`);
        process.exit(-1);
    }
    return reference;
}

// Collect  data to insert into database
function collectData(invokingEvent, ruleParameters, callback) {

    // Check defenitions
    checkDefined(invokingEvent, 'invokingEvent');
    checkDefined(invokingEvent.configurationItem, 'configurationItem');
    checkDefined(invokingEvent.configurationItem.configuration, 'configuration');
    checkDefined(ruleParameters.EndureTagKey, 'EndureTagKey');
    checkDefined(invokingEvent.configurationItem.configuration.blockDeviceMappings, 'blockDeviceMappings');
    checkDefined(invokingEvent.configurationItemDiff.changeType, 'changeType');

    // Collect data
    var change_type = invokingEvent.configurationItemDiff.changeType;
    var endure_tag_key = ruleParameters.EndureTagKey;
    var hostConfig = invokingEvent.configurationItem.configuration;
    var dhost_name = invokingEvent.configurationItem.tags.Name ? invokingEvent.configurationItem.tags.Name : ' ';
    var dkey_name = hostConfig.keyName ? hostConfig.keyName : ' ';
    var dinstance_id = hostConfig.instanceId;
    var dinstance_type = hostConfig.instanceType;
    var dos_type = ' ';
    var dprivate_ip_address = hostConfig.privateIpAddress;
    var deip = hostConfig.publicIpAddress ? hostConfig.publicIpAddress : ' ';
    var daccount = invokingEvent.configurationItem.awsAccountId;
    var dregion = invokingEvent.configurationItem.awsRegion;

    // Save appropriate type CREATE_COMPLETE | UPDATE_COMPLETE
    var dstatus = `${change_type}_COMPLETE`;
    var dcreation_type = invokingEvent.configurationItem.tags[endure_tag_key].toUpperCase();

    getVpcStackName(invokingEvent, ruleParameters, function(vpcError, vpc_stackname) {
        if (!vpcError) {
            getVpcDatabaseId(vpc_stackname, function(vpcdbidError, dvpc_id) {
                if (!vpcdbidError) {
                    var data = {
                        host_name: dhost_name,
                        key_name: dkey_name,
                        instance_id: dinstance_id,
                        instance_type: dinstance_type,
                        os_type: dos_type,
                        private_ip_address: dprivate_ip_address,
                        eip: deip,
                        account: daccount,
                        region: dregion,
                        status: dstatus,
                        vpc_id: dvpc_id,
                        creation_type: dcreation_type
                    };
                    checkDefined(invokingEvent.configurationItemDiff.changeType, 'changeType');
                    if (invokingEvent.configurationItemDiff.changeType === 'CREATE') {
                        data.uuid = uuid.v4();
                    }
                    callback(null, data);
                } else {
                    callback(`Error while getting database vpc id: ${vpcdbidError}`);
                }
            });
        } else {
            callback(`Error in getting vpc name: ${vpcError}`);
        }
    });
}

// Insert Volume data to db
function insertEbsVolumesDatatoDB(invokingEvent, ruleParameters, callback) {

    // Connect to database
    connectDB(function(err, connection){
        if (!err) {
            checkDefined(invokingEvent.configurationItem.configuration.instanceId, 'instanceId');
            var instanceId = invokingEvent.configurationItem.configuration.instanceId;
            var encrypted_qry_os_id = process.env.QRY_OS_ID;
            decryptData(encrypted_qry_os_id, function(err, qry_os_id) {
                if (!err) {
                    var queryStr = util.format(qry_os_id, instanceId);
                    connection.query(queryStr, function (err, result) {
                        connection.end();
                        if(!err) {
                            var dinstance_id = result[0].id;
                            getCustomerCredentials(invokingEvent, ruleParameters, function(err, customer_creds) {
                                if (!err) {
                                    checkDefined(invokingEvent.configurationItem.awsRegion, 'awsRegion');
                                    var customer_region = invokingEvent.configurationItem.awsRegion;
                                    var ec2 = new aws.EC2({region: customer_region, credentials: customer_creds});
                                    checkDefined(invokingEvent.configurationItem.configuration.blockDeviceMappings, 'blockDeviceMappings');
                                    var blockDevices = invokingEvent.configurationItem.configuration.blockDeviceMappings;
                                    var volumeids = [];
                                    blockDevices.forEach(function(device){
                                        if (device.deviceName !== '/dev/xvda' && device.deviceName !== '/dev/sda1') {
                                            volumeids.push(device.ebs.volumeId);
                                        }
                                    });
                                    if (volumeids.length < 1) {
                                        callback("Skipped", null);
                                    }
                                    var params = {
                                        VolumeIds: volumeids
                                    };
                                    ec2.describeVolumes(params, function(err, volumeData){
                                        if(err){
                                            callback(err, null);
                                        } else {
                                            volumeData.Volumes.forEach(function(volume) {
                                                var endure_tag_key = ruleParameters.EndureTagKey;
                                                var vvolume_name = invokingEvent.configurationItem.tags.Name ? invokingEvent.configurationItem.tags.Name : ' ';

                                                // Attaching Volume Id to Volume Name.
                                                // This will be useful to reference the volume when we are deleting it from
                                                // AWS Console rather than Managed Cloud AWS portal,
                                                // since this volume will be part of MIGRATED or DR instance
                                                vvolume_name += `:${volume.VolumeId}`;

                                                var vencrypt = volume.Encrypted.toString();
                                                var vsize = volume.Size;
                                                var vaccount = invokingEvent.configurationItem.awsAccountId;
                                                var vregion = invokingEvent.configurationItem.awsRegion;
                                                var vstatus = 'CREATE_COMPLETE';
                                                var vuuid = uuid.v4();
                                                var vmanagedos_id = dinstance_id;
                                                var vcreation_type = invokingEvent.configurationItem.tags[endure_tag_key].toUpperCase();
                                                var data = {
                                                    volume_name: vvolume_name,
                                                    encrypt: vencrypt,
                                                    size: vsize,
                                                    account: vaccount,
                                                    region: vregion,
                                                    status: vstatus,
                                                    uuid: vuuid,
                                                    managedos_id: vmanagedos_id,
                                                    creation_type: vcreation_type
                                                };

                                                // Connect to database
                                                connectDB(function(err, connection) {
                                                    if(!err) {
                                                        var encrypted_qry_ins_vol = process.env.QRY_INS_VOL;
                                                        decryptData(encrypted_qry_ins_vol, function(err, qry_ins_vol) {
                                                            if (!err) {
                                                                var queryStr = util.format(qry_ins_vol,
                                                                                           data.volume_name,
                                                                                           data.encrypt,
                                                                                           data.size,
                                                                                           data.account,
                                                                                           data.region,
                                                                                           data.status,
                                                                                           data.uuid,
                                                                                           data.managedos_id,
                                                                                           data.creation_type);
                                                                connection.query(queryStr, function (err, result) {
                                                                    connection.end();
                                                                    if(!err) {
                                                                        console.log("Inserted 1 row: ", result);
                                                                        callback(null, true);
                                                                    } else {
                                                                        callback(`Error while perfoming query: ${err}`, false);
                                                                    }
                                                                });
                                                            } else {
                                                                console.log(err);
                                                                callback(err, null);
                                                            }
                                                        });
                                                    } else {
                                                        callback(err, null);
                                                    }
                                                });
                                            });
                                        }
                                    });
                                } else {
                                    callback(err, null);
                                }
                            });
                        } else {
                            console.log(err);
                            callback(err, null);
                        }
                    });
                } else {
                    console.log(err);
                    callback(err, null);
                }
            });
        } else {
            console.log(err);
            callback(err, null);
        }
    });
}

// Insert Instance data to db
function insertInstanceDataToDB(data, callback) {

    // Connect to database
    connectDB(function(err, connection){
        if(!err) {

            var encrypted_qry_ins_os = process.env.QRY_INS_OS;
            decryptData(encrypted_qry_ins_os, function(err, qry_ins_os) {
                if (!err) {
                    var queryStr = util.format(qry_ins_os,
                                               data.host_name,
                                               data.key_name,
                                               data.instance_id,
                                               data.instance_type,
                                               data.os_type,
                                               data.private_ip_address,
                                               data.eip,
                                               data.account,
                                               data.region,
                                               data.status,
                                               data.uuid,
                                               data.vpc_id,
                                               data.creation_type);
                    connection.query(queryStr, function (err, result) {
                        connection.end();
                        if(!err) {
                            console.log("Inserted 1 row: ", result);
                            callback(null, true);
                        } else {
                            callback(`Error while perfoming query: ${err}`, false);
                        }
                    });
                } else {
                    console.log(err);
                    callback(err, null);
                }
            });
        } else {
            callback(err, null);
        }
    });
}


// Update Instance data to db
function updateInstanceData(data, callback) {

    // Connect to database
    connectDB(function(err, connection){
        if(!err) {

            var encrypted_qry_updt_os = process.env.QRY_UPDT_OS;
            decryptData(encrypted_qry_updt_os, function(err, qry_updt_os) {
                if (!err) {
                    var queryStr = util.format(qry_updt_os,
                                               data.host_name,
                                               data.key_name,
                                               data.instance_type,
                                               data.os_type,
                                               data.private_ip_address,
                                               data.eip,
                                               data.account,
                                               data.region,
                                               data.status,
                                               data.vpc_id,
                                               data.creation_type,
                                               data.instance_id);
                    connection.query(queryStr, function (err, result) {
                        connection.end();
                        if(!err) {
                            console.log("Updated 1 row: ", result);
                            callback(null, true);
                        } else {
                            callback(`Error while perfoming query: ${err}`, false);
                        }
                    });
                } else {
                    console.log(err);
                    callback(err, null);
                }
            });
        } else {
            callback(err, null);
        }
    });
}


// Validate Config CREATE
function configInsertValidate(invokingEvent, ruleParameters, callback) {
    checkDefined(invokingEvent, 'invokingEvent');
    checkDefined(invokingEvent.configurationItemDiff, 'configurationItemDiff');
    checkDefined(ruleParameters, 'ruleParameters');
    checkDefined(ruleParameters.EndureTagKey, 'EndureTagKey');
    var endure_tag_key = ruleParameters.EndureTagKey;
    if (invokingEvent.configurationItemDiff !== null) {
        checkDefined(invokingEvent.configurationItemDiff.changeType, 'changeType');
        var changetype = invokingEvent.configurationItemDiff.changeType;
        if (changetype === 'CREATE') {
            var instance = invokingEvent.configurationItem.configuration.instanceId;
            checkDefined(instance, 'instanceId');
            checkInstanceAdded(instance, (err, added) => {
                console.log(err, added);
                if (added) {
                    console.log(`Instance (${instance}) already added in db. Skipping..`);
                    callback(null, false);
                } else {
                    checkDefined(invokingEvent.configurationItem, 'configurationItem');
                    checkDefined(invokingEvent.configurationItem.tags, 'tags');
                    var tags = invokingEvent.configurationItem.tags;
                    checkDefined(tags[endure_tag_key], endure_tag_key);
                    callback(null, true);
                }
            });
        } else {
            console.log(`Skipping since, Config change type is: ${changetype}`);
            callback(null, false);
        }
    } else {
        console.log(`Error: ${invokingEvent.configurationItemDiff} is null`);
        callback(null, false);
    }
}

// Validate Config UPDATE
function configUpdateValidate(invokingEvent, ruleParameters, callback) {
    checkDefined(invokingEvent, 'invokingEvent');
    checkDefined(invokingEvent.configurationItemDiff, 'configurationItemDiff');
    checkDefined(ruleParameters, 'ruleParameters');
    checkDefined(ruleParameters.EndureTagKey, 'EndureTagKey');
    var endure_tag_key = ruleParameters.EndureTagKey;
    if (invokingEvent.configurationItemDiff !== null) {
        checkDefined(invokingEvent.configurationItemDiff.changeType, 'changeType');
        var changetype = invokingEvent.configurationItemDiff.changeType;
        if (changetype === 'UPDATE') {
            var instance = invokingEvent.configurationItem.configuration.instanceId;
            checkDefined(instance, 'instanceId');
            checkInstanceAdded(instance, (err, added) => {
                console.log(err, added);
                if (added) {
                    checkDefined(invokingEvent.configurationItem, 'configurationItem');
                    checkDefined(invokingEvent.configurationItem.tags, 'tags');
                    var tags = invokingEvent.configurationItem.tags;
                    checkDefined(tags[endure_tag_key], endure_tag_key);
                    callback(null, true);
                } else {
                    console.log(`Instance (${instance}) already added in db. Skipping..`);
                    callback(null, false);
                }
            });
        } else {
            console.log(`Skipping since, Config change type is: ${changetype}`);
            callback(null, false);
        }
    } else {
        console.log(`Error: ${invokingEvent.configurationItemDiff} is null`);
        callback(null, false);
    }
}

function getDbInstanceId(instanceId, callback) {

    // Connect to database
    connectDB(function(err, connection){
        if(!err) {
            var encrypted_qry_os_id = process.env.QRY_OS_ID;
            decryptData(encrypted_qry_os_id, function(err, qry_os_id) {
                if (!err) {
                    var queryStr = util.format(qry_os_id, instanceId);
                    connection.query(queryStr, function (err, result) {
                        connection.end();
                        if(!err) {
                            if (result.length > 0) {
                                callback(null, result[0].id);
                            } else {
                                callback(null, false);
                            }
                        } else {
                            callback(`Error while perfoming query! ${err}`, null);
                        }
                    });
                } else {
                    console.log(err);
                    callback(err, null);
                }
            });
        } else {
            callback(err, null);
        }
    });
}

function checkInstanceAdded(instanceId, callback) {

    getDbInstanceId(instanceId, function(err, db_instance_id) {
        if (db_instance_id) {
            callback(null, true);
        } else {
            callback(err, db_instance_id);
        }
    });
}

// This is the handler that's invoked by Lambda
// Most of this code is boilerplate; use as is
exports.handler = (event, context, callback) => {
    checkDefined(event, 'event');
    const invokingEvent = JSON.parse(event.invokingEvent);
    const ruleParameters = JSON.parse(event.ruleParameters);
    configInsertValidate(invokingEvent, ruleParameters, (err, validated) => {
        if (validated) {
            console.log("Insert row to db");
            collectData(invokingEvent, ruleParameters, (error, data) => {
                if (data) {
                    console.log("Data collected for insert db");
                    insertInstanceDataToDB(data, (insertInstanceDbError, instanceInserted) => {
                        if(instanceInserted) {
                            console.log("Successfully inserted instance data to db");
                            insertEbsVolumesDatatoDB(invokingEvent, ruleParameters, (insertVolumeDbError, volumeInserted) => {
                                if(volumeInserted) {
                                    console.log("Successfully inserted volume data to db");
                                    callback("Success");
                                } else {
                                    console.log(`Did not insert volume data to db: ${insertVolumeDbError}`);
                                    callback(`Error: Did not insert volume data to db: ${insertVolumeDbError}`);
                                }
                            });
                        } else {
                            console.log(`Unable to insert instance data to db: ${insertInstanceDbError}`);
                            callback("Failed");
                        }
                    });
                } else {
                    console.log(`Could not collect data: ${data}, error: ${error}`);
                    callback(`Error: Could not collect data: ${data}, error: ${error}`);
                }
            });
        } else {
            configUpdateValidate(invokingEvent, ruleParameters, (err, validated) => {
                if (validated) {
                    var instanceId = invokingEvent.configurationItem.configuration.instanceId;
                    getDbInstanceId(instanceId, (err, db_instance_id) => {
                        collectData(invokingEvent, ruleParameters, (err, updateData) => {
                            if (updateData) {
                                console.log("Data collected for db update");
                                updateInstanceData(updateData, (updateInstnaceError, instanceUpdated) => {
                                    if(instanceUpdated) {
                                        console.log("Successfully updated instance data to db");
                                        callback("Success");
                                    } else {
                                        console.log(`Unable to update instance data to db: ${updateInstnaceError}`);
                                        callback("Failed");
                                    }
                                });
                            } else {
                                console.log(`Could not collect update data: ${updateData}, error: ${err}`);
                                callback(`Error: Could not collect update data: ${updateData}, error: ${err}`);
                            }
                        });
                    });
                } else {
                    console.log("Skiping.. Config Change");
                    callback("Skiping.. Config Change");
                }
            });
        }
    });
};
