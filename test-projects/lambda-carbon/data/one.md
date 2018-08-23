

# Locally sending a generic event

sam local invoke HelloWorldFunction -e data\test-event-1.json --human

sam validate -t super-lambda.yaml

sam package --template-file super-lambda.yaml \
      --output-template-file packaged-super.yaml \
      --s3-bucket netlab-dev

sam deploy --template-file packaged-super.yaml --stack-name super-lambda




# One of he S3 impls

sam local start-api -t ..\template.yaml

node lib\ra2\invoke.js invoke .\lib\aws\s3.js getObject --Bucket=netlab-dev-ingest  --Key=SPA/SPARKSB3/20180809094015816/logs/4921ac3cc1a348a90.json





