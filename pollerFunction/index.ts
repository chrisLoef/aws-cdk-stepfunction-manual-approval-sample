import * as AWS from 'aws-sdk';
const stepfunctions = new AWS.StepFunctions();
const ses = new AWS.SES();

exports.handler = async () => {
  var taskParams: AWS.StepFunctions.GetActivityTaskInput = {
    activityArn: process.env.ACTIVITY_ARN!
  };
  try {
    const activityTask = await stepfunctions.getActivityTask(taskParams).promise();
    console.log(activityTask);
    if (activityTask.taskToken && activityTask.input) {
      const input = JSON.parse(activityTask.input);
      console.log('input', JSON.stringify(input));
      const emailParams: AWS.SES.SendEmailRequest = {
        Destination: {
          ToAddresses: [
            input.managerEmailAddress
          ]
        },
        Message: {
          Subject: {
            Data: 'Your Approval Needed for Promotion!',
            Charset: 'UTF-8'
          },
          Body: {
            Html: {
              Data: 'Hi!<br />' +
                input.employeeName + ' has been nominated for promotion!<br />' +
                'Can you please approve:<br />' +
                `https://${process.env.API_DEPLOYMENT_ID}.execute-api.${process.env.REGION}.amazonaws.com/prod/succeed?taskToken=` + encodeURIComponent(activityTask.taskToken) + '<br />' +
                'Or reject:<br />' +
                `https://${process.env.API_DEPLOYMENT_ID}.execute-api.${process.env.REGION}.amazonaws.com/prod/fail?taskToken=` + encodeURIComponent(activityTask.taskToken),
              Charset: 'UTF-8'
            }
          }
        },
        Source: input.managerEmailAddress,
        ReplyToAddresses: [
          input.managerEmailAddress
        ]
      };
      const sesResult = await ses.sendEmail(emailParams).promise();
      console.log(sesResult);
      return 'Yes';
    } else {
      console.log('No Active Activity');
      return 'Yes';
    }
    return 'No';
    
  } catch (error) {
    console.log(error);
    
    throw (error);
    return 'No';
  }
};