<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://avatars.githubusercontent.com/u/22873154?s=400&u=114cc3bfdec11bc1e0f6b25170f812ee2a3b03c2&v=4" width="320" alt="Nest Logo" /></a>
</p>

## Description

<p align="center">A <a href="http://nodejs.org" target="_blank">Node.js</a> application to scan and index files to db to quickly find information about this files through http requests.</p>
    <p align="center">

[Nest](https://github.com/nestjs/nest) framework used for http server.

## Installation

```bash
$ npm install
```

## Running the app

If you want you may run it as usual Nest app, but IT WON`T WORK without additional configuration (you need to change DB url in code and etc.)
```bash
# development
$ npm run start
```

Or you can run my docker version

Simply run

```
DockerBuild.bat
```

or

```bash
$ docker build -t nest-mongo-directory-scanner .
```
```bash
$ docker-compose up
```
