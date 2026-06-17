pipeline {
    agent any

    tools {
        nodejs 'NodeJS 18'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Instalar dependencias') {
            steps {
                bat 'npm install'
            }
        }

        stage('Ejecutar pruebas') {
            steps {
                bat 'npm test'
            }
        }
    }

    post {
        success {
            echo 'Todas las pruebas pasaron correctamente'
        }
        failure {
            echo 'Hubo errores en las pruebas'
        }
    }
}
