aws dynamodb create-table \
  --table-name global_exchanges \
  --attribute-definitions AttributeName=id,AttributeType=S  \
  --key-schema AttributeName=id,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --endpoint-url http://localhost:8000

aws dynamodb put-item \
  --table-name global_exchanges \
  --item file://sample.json \
  --endpoint-url http://localhost:8000

aws dynamodb get-item \
  --table-name global_exchanges \
  --key file://key.json \
  --endpoint-url http://localhost:8000