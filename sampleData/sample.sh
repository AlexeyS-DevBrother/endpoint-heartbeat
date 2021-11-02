aws dynamodb create-table \
  --table-name global_exchanges \
  --attribute-definitions AttributeName=id,AttributeType=S  \
  --key-schema AttributeName=id,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --endpoint-url http://localhost:8000

aws dynamodb put-item \
  --table-name global_exchanges \
  --item file://sampleData/sample.json \
  --endpoint-url http://localhost:8000

aws dynamodb get-item \
  --table-name global_exchanges \
  --key file://sampleData/key.json \
  --endpoint-url http://localhost:8000

aws dynamodb delete-item \
  --table-name global_exchanges \
  --key file://sampleData/key.json \
  --endpoint-url http://localhost:8000