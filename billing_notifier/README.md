
## How to populate 'EstimatedCharges' metric of 'CTOBilling'

  > node populate_sim_metric_data -p default -r us-east-1 [-v 20123]


## How to deploy

  > node deploy_notifier deploy -p default -r us-east-1 -i 290093585298 -m 128 -t 3 [--sim=true|false]


## How to undeploy

  > node deploy_notifier undeploy -p default -r us-east-1 [--sim=true|false]
