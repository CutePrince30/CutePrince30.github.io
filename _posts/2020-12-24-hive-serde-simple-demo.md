---
layout: post
title: Hive SerDe说明及简单应用
comments: true
tags: [tech]
---

Hive能够支持多种数据格式，其中SerDe起到了非常重要的作用。
此文章旨在帮助第一次接触Hive SerDe的同学, 希望能够帮到大家.

## SerDe是什么
```text
SerDe 是 Serializer/Deserializer 的缩写。 Hive 将 SerDe 接口用于 IO。该接口既处理序列化和反序列化，又将序列化的结果解释为要处理的单个字段。

SerDe 允许 Hive 从表中读取数据，并将其以任何自定义格式写回 HDFS。任何人都可以为自己的数据格式编写自己的 SerDe。
```

## Serialization and Deserialization
### Java
```
Java对象 --> byte[]
序列化 — Process of converting an object in memory into bytes that can be stored in a file or transmitted over a network.

byte[] --> Java对象
反序列化 — Process of converting the bytes back into an object in memory.
```

### hive
```text
hive的row --> hadoop的writable 
序列化 — An insert statement creates serialized data(files) that can be stored into an external storage like HDFS

hadoop的writable --> hive的row
反序列化 — A select statement creates deserialized data(columns) that is understood by Hive.
```
