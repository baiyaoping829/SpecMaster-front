pipeline {
  agent any
  options {
    timestamps()
    ansiColor('xterm')
  }
  environment {
    CI = '1'
    E2E_SUCCESS_RATE = '99'
    E2E_P99_MS = '800'
    E2E_SKIP_BUILD = '1'
  }
  stages {
    stage('Install') {
      steps {
        sh 'node -v'
        sh 'npm -v'
        sh 'npm ci'
        sh 'npx playwright install --with-deps'
      }
    }
    stage('Build') {
      steps {
        sh 'npm run build'
      }
    }
    stage('Unit & Integration') {
      steps {
        sh 'npm test'
        sh 'npm run test:ui'
        sh 'npm run test:integration'
      }
    }
    stage('E2E Humanized') {
      steps {
        sh 'npm run e2e:human'
        sh 'npm run e2e:report || true'
      }
      post {
        always {
          archiveArtifacts artifacts: 'reports/**,allure-report/**,allure-results/**,.e2e/**,test-results/**', fingerprint: true, allowEmptyArchive: true
        }
      }
    }
  }
}

