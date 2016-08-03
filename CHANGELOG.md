# Change Log
All notable changes to this project will be documented in this file.

## [1.3] - 2016-06-30
### Added
- Volumes
  - Implemented a Lambda function to tag untagged volumes
  - Configured with NAT Gateway to enable access to MSAWS management tool database in a VPC

### Changed
- AWSConfig
  - Fixed the policy document that causes a failure in creating a role during enabling AWSConfig. This was an issue only for certain AWS accounts.
- Billing Alert
  - Added more accounts

### Removed
- None

## [1.2] - 2015-03-19
### Added
- Billing Alert
  - Implemented to prevent usage alerts when increased percentages of usages exceed threshold but increased usages are less than the average usage of previous month
- AWSConfig & CloudTrail
  - Implemented all region support
  - Added cloudformation particles for CTO Blog

### Changed
- Alarm Alert
  - Fixed a bug of failure in saving alert emails

### Removed
- None

## [1.1] - 2015-12-31
### Added
- Initial release of
  - Alarm Alert
  - Billing Alert
  - AWSConfig
  - CloudTrail
- First integration with MSAWS management tool

### Changed
- None

### Removed
- None
