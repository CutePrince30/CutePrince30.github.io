---
layout: post
title: 单机搭建hadoop开发环境
comments: true
tags: [tech]
---

记一次在阿里云ECS上搭建hadoop开发环境的经历

## Hadoop
### 安装包下载
```shell script
$ wget https://mirrors.tuna.tsinghua.edu.cn/apache/hadoop/common/hadoop-3.1.4/hadoop-3.1.4.tar.gz
```
### 配置
#### ssh免密登录（单机也需要）
```shell script
$ ssh-keygen -t dsa -P '' -f ~/.ssh/id_dsa
$ cat ~/.ssh/id_dsa.pub >> ~/.ssh/authorized_keys
$ chmod 0600 ~/.ssh/authorized_keys
```
#### 安装JAVA
```shell script
# java安装包自行下载
$ rpm -ivh jdk-8u271-linux-x64.rpm
```
#### 创建数据存储目录
```text
NameNode 数据存放目录: /home/dev/data/hadoop/name
SecondaryNameNode 数据存放目录: /home/dev/data/hadoop/secondary
DataNode 数据存放目录: /home/dev/data/hadoop/data
临时数据存放目录: /home/dev/data/hadoop/tmp
```
```shell script
$ cd
$ mkdir -p /home/dev/data/hadoop/name
$ mkdir -p /usr/local/data/hadoop/secondary
$ mkdir -p /home/dev/data/hadoop/data
$ mkdir -p /home/dev/data/hadoop/tmp
```
#### 配置环境变量
```shell script
$ vim ~/.bash_profile

export HADOOP_HOME=/home/dev/hadoop-3.1.4
PATH=$PATH:$HOME/.local/bin:$HOME/bin:$HADOOP_HOME/bin

export PATH
```
#### 配置文件
```shell script
# hadoop-env.sh 最后一行添加
export JAVA_HOME=/usr/java/jdk1.8.0_271-amd64

# core-site.xml

<configuration>
    <property>
        <name>fs.defaultFS</name>
        <value>hdfs://localhost:9000</value>
        <description>hdfs内部通讯访问地址</description>
    </property>
    <property>
        <name>hadoop.tmp.dir</name>
        <value>/home/dev/data/hadoop/tmp</value>
        <description>hadoop数据存放</description>
    </property>
</configuration>

# hdfs-site.xml

<configuration>
    <property>
        <name>dfs.replication</name>
        <value>1</value>
    </property>
    <property>
        <name>dfs.namenode.name.dir</name>
        <value>/home/dev/data/hadoop/name</value>
    </property>
    <property>
        <name>dfs.datanode.data.dir</name>
        <value>/home/dev/data/hadoop/data</value>
    </property>
</configuration>

# mapred-site.xml

<configuration>
    <property>
        <name>mapreduce.framework.name</name>
        <value>yarn</value>
    </property>
</configuration>

# yarn-site.xml

<configuration>
    <property>
        <name>yarn.resourcemanager.hostname</name>
        <value>0.0.0.0</value>
    </property>
    <property> 
        <name>yarn.nodemanager.aux-services</name> 
        <value>mapreduce_shuffle</value> 
    </property> 
</configuration>
```
### 启动
```shell script
# 格式化
$ hdfs namenode -format

# 启动NameNode、SecondaryNameNode、DataNode、ResourceManager、NodeManager
$ start-all.sh

# 关闭安全模式
$ hdfs dfsadmin -safemode leave
```
### 验证启动
```shell script
$ jps
18288 Jps
6737 NameNode
6883 DataNode
11322 ResourceManager
11451 NodeManager
7069 SecondaryNameNode
```

### 说明

## Hive
### 安装包下载(hadoop3以上，最好使用hive3以上的版本)
```shell script
wget https://mirrors.tuna.tsinghua.edu.cn/apache/hive/hive-3.1.2/apache-hive-3.1.2-bin.tar.gz
```
### 配置
#### 配置环境变量
```shell script
$ vim ~/.bash_profile

export HIVE_HOME=/home/dev/hive-3.1.2
PATH=$PATH:$HOME/.local/bin:$HOME/bin:$HADOOP_HOME/bin:$HADOOP_HOME/sbin:$HIVE_HOME/bin

export PATH
```
#### JAR包
```text
1. 替换lib下的guava-19.0.jar 为 guava-28.0-jre.jar
2. 添加mysql-connector-java-5.1.47.jar
```
#### 配置文件
```shell script
$ cp hive-log4j2.properties.template hive-log4j2.properties
$ cp hive-exec-log4j2.properties.template hive-exec-log4j2.properties
$ cp beeline-log4j2.properties.template beeline-log4j2.properties

# hive-env.sh

HADOOP_HOME=/home/dev/hadoop-3.1.4
export HIVE_CONF_DIR=/home/dev/hive-3.1.2/conf

# hive-site.xml

<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<?xml-stylesheet type="text/xsl" href="configuration.xsl"?>
<configuration>
  <property>
    <name>javax.jdo.option.ConnectionURL</name>
    <value>jdbc:mysql://localhost:3306/hive?createDatabaseIfNotExist=true&amp;characterEncoding=UTF-8&amp;useSSL=false</value>
  </property>
  <property>
    <name>javax.jdo.option.ConnectionDriverName</name>
    <value>com.mysql.jdbc.Driver</value>
  </property>
  <property>
    <name>javax.jdo.option.ConnectionUserName</name>
    <value>root</value>
  </property>
  <property>
    <name>javax.jdo.option.ConnectionPassword</name>
    <value>xxxxx</value>
  </property>
  <property>
    <name>hive.metastore.schema.verification</name>
    <value>false</value>
  </property>
  <property>
    <name>hive.exec.local.scratchdir</name>
    <value>/home/dev/data/hive/${system:user.name}</value>
    <description>Local scratch space for Hive jobs</description>
  </property>
  <property>
    <name>hive.downloaded.resources.dir</name>
    <value>/home/dev/data/hive/${hive.session.id}_resources</value>
    <description>Temporary local directory for added resources in the remote file system.</description>
  </property>
  <property>
    <name>hive.server2.logging.operation.log.location</name>
    <value>/home/dev/data/hive/${system:user.name}/operation_logs</value>
    <description>Top level directory where operation logs are stored if logging functionality is enabled</description>
  </property>
  <property>
    <name>hive.metastore.warehouse.dir</name>
    <value>/hive/warehouse</value>
    <description>location of default database for the warehouse</description>
  </property>
</configuration>
```
### 启动
```shell script
$ bin/schematool -initSchema -dbType mysql
```
### 说明


## Spark
### 安装包下载
```shell script

```
### 配置
```shell script

```
### 启动
### 说明

## HBase
### 安装包下载
```shell script
wget https://mirrors.tuna.tsinghua.edu.cn/apache/hbase/2.4.0/hbase-2.4.0-bin.tar.gz
```
### 配置
### 启动
### 说明

## Flink
### 安装包下载
```shell script
wget https://mirrors.tuna.tsinghua.edu.cn/apache/flink/flink-1.12.0/flink-1.12.0-bin-scala_2.11.tgz
```
### 配置
### 启动
### 说明