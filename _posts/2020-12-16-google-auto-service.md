---
layout: post
title: Google Auto Service 使用说明
comments: true
tags: [tech]
---

此文章旨在帮助第一次接触Google Auto Service的同学, 希望能够帮到大家.

## pom.xml
```xml
<dependencies>
    <!-- https://mvnrepository.com/artifact/com.google.auto.service/auto-service -->
    <dependency>
        <groupId>com.google.auto.service</groupId>
        <artifactId>auto-service</artifactId>
        <version>1.0-rc7</version>
    </dependency>
    <dependency>
        <groupId>junit</groupId>
        <artifactId>junit</artifactId>
        <version>4.12</version>
    </dependency>
</dependencies>
```

## Input接口
```java
import com.google.auto.service.AutoService;

@AutoService(Input.class)
public class MyInput implements Input {
    @Override
    public String input() {
        return "我的输入";
    }
}
```

## Input默认实现
```java
import com.google.auto.service.AutoService;

@AutoService(Input.class)
public class DefaultInput implements Input {
    @Override
    public String input() {
        return "输入";
    }
}
```

## 测试
```java
public class AppTest {
    @Test
    public void test() {
        ServiceLoader<Input> serviceLoader = ServiceLoader.load(Input.class);
        for (Input input : serviceLoader) {
            System.out.println(input.input());
        }
    }
}
```
