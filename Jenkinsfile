pipeline {
    agent any // Or specify a label for an agent with Node.js and AWS CLI: agent { label 'nodejs-aws' }

    tools {
        // Make sure 'NodeJS-22' matches a NodeJS installation configured in Jenkins Global Tool Configuration
        // Or remove this block if node/npm are already available in the agent's PATH
        nodejs 'NodeJs_v22'
    }

    stages {
        stage('Checkout') {
            steps {
                echo "Checking out code from prod branch..."
                // This checks out the code based on the branch configured in the Jenkins job
                // Ensure the Jenkins job is configured to monitor the 'prod' branch.
                checkout scm
            }
        }

        // stage('Install Dependencies') {
        //     steps {
        //         echo "Installing Node.js dependencies..."
        //         // Clean install is often safer in CI/CD
        //         sh 'npm ci'
        //         // Or if you don't have package-lock.json: sh 'npm install'
        //     }
        // }

        stage('Run Tests') { // Optional but Recommended
            steps {
                echo "Running tests..."
                // Add your test command here, e.g.:
                // sh 'npm test'
            }
        }

        // stage('Build Application') { // Optional: If you have a build step (e.g., for TypeScript, React, Vue)
        //     when {
        //         // Add condition if build is only needed sometimes, or remove 'when' block
        //         expression { fileExists('package.json') && sh(script: 'jq .scripts.build package.json', returnStatus: true) == 0 } // Check if build script exists
        //     }
        //     steps {
        //         echo "Building application... ${EB_APP_NAME}"
        //         sh 'npm run build'
        //     }
        // }

        // Fetch Current Environment Variables ---
        // stage('Fetch Current Environment Variables') {
        //     steps {
        //         script {
        //             echo "Fetching current environment variables for environment: ${env.EB_ENV_NAME}"
        //             withCredentials([aws(credentialsId: '282509bd-0b66-48ff-905b-a100746fbb32', accessKeyVariable: 'AWS_ACCESS_KEY_ID', secretKeyVariable: 'AWS_SECRET_ACCESS_KEY')]) {
        //                 def envVarsJsonString = sh(returnStdout: true, script: """
        //                     set +e
        //                     RAW_JSON=\$(aws elasticbeanstalk describe-configuration-settings \\
        //                         --application-name "${env.EB_APP_NAME}" \\
        //                         --environment-name "${env.EB_ENV_NAME}" \\
        //                         --region "${env.AWS_REGION}" \\
        //                         --query "ConfigurationSettings[?Namespace=='aws:elasticbeanstalk:application:jenkins_node_server'].OptionSettings[]" \\
        //                         --output json)
        //                     EXIT_CODE=\$?
        //                     set -e
        //                     if [ \$EXIT_CODE -ne 0 ]; then
        //                         echo "Warning: Could not fetch environment variables. Check IAM permissions or environment name."
        //                         echo "[]"
        //                         echo "RAW_JSON: []"
        //                     else
        //                         echo "Fetched RAW JSON: \$(echo \$RAW_JSON | jq '.')"
        //                         echo "\$RAW_JSON"
        //                     fi
        //                 """).trim()
        //                 env.FETCHED_ENV_VARS_JSON = envVarsJsonString
        //                 echo "--- Current Environment Variables ---"
        //                 sh """
        //                     echo '${envVarsJsonString}' | jq -r '.[] | "\\(.OptionName)=\\(.Value)"' || echo "Could not parse environment variables JSON for logging. Is jq installed?"
        //                 """
        //                 echo "-------------------------------------"
        //             }
        //         }
        //     }
        // }

        stage('Package Application') {
            steps {
                script {
                env.VERSION_LABEL = "${env.EB_APP_NAME}-${env.BUILD_NUMBER}-${new Date().format('yyyyMMddHHmmss')}"
                env.ARCHIVE_NAME = "${env.VERSION_LABEL}.zip"

                echo "Creating application archive: ${env.ARCHIVE_NAME}"

                sh "zip -r ${env.ARCHIVE_NAME} . -x '.git/*' 'node_modules/*' 'Jenkinsfile'"
                }
            }
        }

        stage('Upload to S3') {
            steps {
                withCredentials([aws(credentialsId: '282509bd-0b66-48ff-905b-a100746fbb32', accessKeyVariable: 'AWS_ACCESS_KEY_ID', secretKeyVariable: 'AWS_SECRET_ACCESS_KEY')]) {
                    echo "Uploading ${env.ARCHIVE_NAME} to s3://${env.S3_BUCKET}/${env.ARCHIVE_NAME}"
                    sh """
                        aws s3 cp ${env.ARCHIVE_NAME} s3://${env.S3_BUCKET}/${env.ARCHIVE_NAME} --region ${env.AWS_REGION}
                    """
                }
            }
        }

        stage('Deploy to Elastic Beanstalk') {
            steps {
                withCredentials([aws(credentialsId: '282509bd-0b66-48ff-905b-a100746fbb32', accessKeyVariable: 'AWS_ACCESS_KEY_ID', secretKeyVariable: 'AWS_SECRET_ACCESS_KEY')]) {
                    echo "Creating Elastic Beanstalk Application Version: ${env.VERSION_LABEL}"
                    sh """
                        aws elasticbeanstalk create-application-version \\
                          --application-name "${env.EB_APP_NAME}" \\
                          --version-label "${env.VERSION_LABEL}" \\
                          --description "Commit: ${GIT_COMMIT.substring(0, 7)} Build: ${env.BUILD_NUMBER}" \\
                          --source-bundle S3Bucket="${env.S3_BUCKET}",S3Key="${env.ARCHIVE_NAME}" \\
                          --region "${env.AWS_REGION}" \\
                          --auto-create-application # Optional: Creates app if it doesn't exist, remove if not desired
                    """

                    echo "Updating Elastic Beanstalk Environment: ${env.EB_ENV_NAME} to version ${env.VERSION_LABEL}"
                    sh """
                        aws elasticbeanstalk update-environment \\
                          --application-name "${env.EB_APP_NAME}" \\
                          --environment-name "${env.EB_ENV_NAME}" \\
                          --version-label "${env.VERSION_LABEL}" \\
                          --region "${env.AWS_REGION}" \\
                    """

                   // Optional: Add a check here to monitor deployment status until completion
                    // This will make the pipeline wait until the environment is Ready or Degraded
                    echo "Waiting for environment update to complete..."
                    sh """
                        aws elasticbeanstalk wait environment-updated --environment-name "${env.EB_ENV_NAME}" --region "${env.AWS_REGION}"
                        # Check the final status after waiting
                        STATUS=\$(aws elasticbeanstalk describe-environments --environment-names "${env.EB_ENV_NAME}" --region "${env.AWS_REGION}" --query 'Environments[0].Status' --output text)
                        HEALTH=\$(aws elasticbeanstalk describe-environments --environment-names "${env.EB_ENV_NAME}" --region "${env.AWS_REGION}" --query 'Environments[0].Health' --output text)
                        echo "Environment status: \$STATUS, Health: \$HEALTH"
                        if [ "\$STATUS" != "Ready" ] || [ "\$HEALTH" != "Green" ]; then
                            echo "Environment update finished with status: \$STATUS and health: \$HEALTH"
                            // error "Deployment failed or environment is not healthy." // Uncomment to fail the build on non-Green/Ready status
                        fi
                    """
                }
            }
        }
    }

    post {
        always {
            echo 'Pipeline finished.'
            // Clean up workspace and the created archive
            deleteDir()
            sh "rm -f ${env.ARCHIVE_NAME}" // Clean up the archive file explicitly if needed outside workspace
        }
        success {
            echo 'Deployment successful!'
            // Add notifications (Slack, Email)
        }
        failure {
            echo 'Pipeline failed.'
            // Add notifications (Slack, Email)
        }
    }
}