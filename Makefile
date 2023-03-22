test_local:
	cd lambda && node test.js

deploy:
	cd pulumi && pulumi up -y

test_remote:
	cd pulumi && aws lambda invoke --function-name $(shell cd pulumi && pulumi stack output lambdaFuncName) /dev/stdout