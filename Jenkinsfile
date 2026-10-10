pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/Ambu2809/StudentTaskManager.git'
            }
        }

        stage('Validate Files') {
            steps {
                bat 'if exist index.html (echo index.html found) else (exit 1)'
                bat 'if exist style.css (echo style.css found) else (exit 1)'
                bat 'if exist script.js (echo script.js found) else (exit 1)'
                bat 'if exist README.md (echo README.md found) else (exit 1)'
            }
        }
    }

    post {
        success {
            echo 'Student Task Manager pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed. Please check the console output.'
        }
    }
}