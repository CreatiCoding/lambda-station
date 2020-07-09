# Lambda Station

> 람다를 매우 쉽게 시작할 수 있는 프로젝트

## 1. Getting Started

AWS Lambda! 다음 두 줄로 매우 쉽게 시작할 수 있습니다!

```bash
npx degit creaticoding/lambda-station
yarn install
```

## 2. How to setting your KEY

기본적으로 `direnv`를 사용하여 설정합니다.

[이 곳](https://console.aws.amazon.com/iam/home?region=ap-northeast-2#/roles$new)(https://console.aws.amazon.com/iam/home?region=ap-northeast-2#/roles$new)에서 Lambda 배포를 위한 권한을 가진 역할(Role)을 생성하여 해당 역할의 Key를 `.envrc`에 채우세요!
기본적으로 `.envrc`파일은 이미 gitignore 상태입니다.

```
export AWS_ACCESS_KEY_ID=액세스키
export AWS_SECRET_ACCESS_KEY=시크릿키
export AWS_REGION=ap-northeast-2
export AWS_DEFAULT_REGION=ap-northeast-2
```

## 3. How to deploy lmabda-directory

다음 명령어로 Lambda를 손쉽게 배포하세요!

```bash
yarn deploy -l src/경로/target-directory
```

### 미지원 목록

- Lambda@edge
- Lambda Layer
