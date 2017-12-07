# fe-build

1.安装命令

```shell
npm install -g fe-build
```

2.执行命令

```shell
fe-build
```

3.帮助信息 (注意: 为了保证速度, npm install 实际执行的是 cnpm install, 请安装 cnpm)

```shell
   Usage: fe-build [options] [command]


          step1: git clone repository
          step2: choose your branch
          step3: git checkout branch
          step4: npm install
          step5: choose your build script
          step6: run build script


    Options:

      -V, --version  output the version number
      -h, --help     output usage information


    Commands:

      start [repository]
          repository: git repository ssh path.

```
