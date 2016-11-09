# build-tools

1.安装命令

```shell
npm install -g ShuyunXIANFESchool/build-tools
```

2.执行命令

```shell
fe-build
```

3.帮助信息

```shell
  Usage: index [options] [command]


  Commands:

    run <repository>  from step1 to step5: <repository> is your git repository ssh path.
    build             from step2 to step5: you need jump to project directory before.


                step1: git clone <repository>
                step2: choose your branch
                step3: git checkout <branchName>
                step4: npm install
                step5: npm run build


  Options:

    -h, --help     output usage information
    -V, --version  output the version number
```
