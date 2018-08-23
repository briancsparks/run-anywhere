





### Must Have Transform

This header must be present to have SAM work with CF templates.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
```


### Minimum Template

This seems to be the minimum that SAM will say is OK.

```yaml
Resources:

    HelloWorldFunction:
        Type: AWS::Serverless::Function
        Properties:
            Handler: central.kitchensink
            Runtime: nodejs8.10
```


