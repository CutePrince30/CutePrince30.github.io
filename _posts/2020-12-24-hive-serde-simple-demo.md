---
layout: post
title: Hive SerDe说明及简单应用
comments: true
tags: [tech]
---

此文章旨在帮助第一次接触Hive SerDe的同学, 希望能够帮到大家.

## SerDe是什么
{: .box-note}
**Note:** 为什么Hive能够支持多种的数据类型，答案就是SerDe:
          1. Serialization and Deserialization
          2. Hive Row Format
          3. Map-reduce Input/Output Format