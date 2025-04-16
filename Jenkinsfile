pipeline {
    agent any
        triggers {
        githubPush() // Triggers on pushes to the repository
        // Or trigger on specific events like Pull Requests:
        // githubPullRequest() // See plugin docs for detailed options
    }
    stages {
        stage('Build') {
            steps {
                echo 'Building..'
            }
        }
        stage('Test') {
            steps {
                echo 'Testing..'
            }
        }
        stage('Deploy') {
            steps {
                echo 'Deploying....'
            }
        }
    }
}
