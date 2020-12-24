---
layout: post
title: Hive SerDe说明及简单应用
comments: true
tags: [tech]
---

Hive能够支持多种数据格式，其中SerDe起到了非常重要的作用。
此文章旨在帮助第一次接触Hive SerDe的同学, 希望能够帮到大家.


## SerDe是什么
SerDe 是 Serializer/Deserializer 的缩写。 Hive 将 SerDe 接口用于 IO。该接口既处理序列化和反序列化，又将序列化的结果解释为要处理的单个字段。

SerDe 允许 Hive 从表中读取数据，并将其以任何自定义格式写回 HDFS。任何人都可以为自己的数据格式编写自己的 SerDe。


## Serialization and Deserialization
### Java

{: .box-note}
Java对象 --> byte[]

序列化 — Process of converting an object in memory into bytes that can be stored in a file or transmitted over a network.

{: .box-note}
byte[] --> Java对象

反序列化 — Process of converting the bytes back into an object in memory.

### hive

{: .box-note}
hive的row --> hadoop的writable
 
序列化 — An insert statement creates serialized data(files) that can be stored into an external storage like HDFS

{: .box-note}
hadoop的writable --> hive的row

反序列化 — A select statement creates deserialized data(columns) that is understood by Hive.


## 表数据行的序列化和反序列化大概过程
* HDFS 文件 ——> InputFileFormat ——> <key, value> ——> 反序列化 ——> 数据行对象（Row object）
* 数据行对象（Row object）——> 序列化 ——> <key, value> ——> OutputFileFormat ——> HDFS 文件


## 内置的SerDe
* Avro
* Orc
* RegEx
* Thrift
* Parquet
* CSV
* JsonSerDe


## SerDe 的使用
```sql
CREATE [EXTERNAL] TABLE [IF NOT EXISTS] table_name
  [(col_name data_type [COMMENT col_comment], ...)]
  [COMMENT table_comment]
  [PARTITIONED BY (col_name data_type [COMMENT col_comment], ...)]
  [CLUSTERED BY (col_name, col_name, ...) [SORTED BY (col_name [ASC|DESC], ...)] INTO num_buckets BUCKETS]
  [
   [ROW FORMAT row_format] [STORED AS file_format]
   | STORED BY 'storage.handler.class.name' [ WITH SERDEPROPERTIES (...) ]  
  ]
  [LOCATION hdfs_path]
  [TBLPROPERTIES (property_name=property_value, ...)]  [AS select_statement]  CREATE [EXTERNAL] TABLE [IF NOT EXISTS] table_name
  LIKE existing_table_name
  [LOCATION hdfs_path]
```

## 演示说明
Hue

## 如何自定义SerDe
### pom.xml
```xml
<dependencies>
    <dependency>
        <groupId>org.apache.hive</groupId>
        <artifactId>hive-common</artifactId>
        <version>3.1.2</version>
        <scope>provided</scope>
    </dependency>
    <dependency>
        <groupId>org.apache.hive</groupId>
        <artifactId>hive-exec</artifactId>
        <version>3.1.2</version>
        <scope>provided</scope>
    </dependency>
</dependencies>
```

### 三个重要方法
* initialize 初始化表的列名、列类型、objectInspector等
* serialize 如何序列化
* deserialize 如何反序列化

### MyCommaSerDe (以逗号为分隔符)
```java
public class MyCommaSerDe extends AbstractSerDe {

    private Logger logger = LoggerFactory.getLogger(MyCommaSerDe.class);

    private final static String FIELD_SEP = ",";
    private final static Text NULL_STRING = new Text("\\N");

    private List<String> columnNames;
    private List<TypeInfo> columnTypes;
    private ObjectInspector objectInspector;

    Text serializeCache = new Text();
    ByteStream.Output serializeStream = new ByteStream.Output();

    @Override
    public void initialize(Configuration conf, Properties tbl) throws SerDeException {
        logger.info("---------------------------> 开始初始化MyCommaSerDe");
        // 获取hive表的列名
        String columnNameProp = tbl.getProperty(serdeConstants.LIST_COLUMNS);
        if (columnNameProp != null && columnNameProp.length() > 0) {
            columnNames = Arrays.asList(columnNameProp.split(","));
        } else {
            columnNames = new ArrayList<String>();
        }
        // 获取列类型
        String columnTypeProp = tbl.getProperty(serdeConstants.LIST_COLUMN_TYPES);
        // 如果没有设置列类型，就默认全部string
        if (columnTypeProp == null) {
            String[] types = new String[columnNames.size()];
            Arrays.fill(types, 0, types.length, serdeConstants.STRING_TYPE_NAME);
            columnTypeProp = StringUtils.join(types, ":");
        }
        columnTypes = TypeInfoUtils.getTypeInfosFromTypeString(columnTypeProp);

        // 检查列名和列类型是否一致
        if (columnTypes.size() != columnNames.size()) {
            throw new SerDeException("len(columnNames) != len(columntTypes)");
        }

        // 为每一列 从列类型中 创建ObjectInspector
        List<ObjectInspector> columnOIs = new ArrayList<ObjectInspector>();
        ObjectInspector oi;
        for (int c = 0; c < columnNames.size(); c++) {
            oi = TypeInfoUtils.getStandardJavaObjectInspectorFromTypeInfo(columnTypes.get(c));
            columnOIs.add(oi);
        }
        objectInspector = ObjectInspectorFactory.getStandardStructObjectInspector(columnNames, columnOIs);
    }

    // Row object –> Serializer –> <key, value> –> OutputFileFormat –> HDFS files
    @Override
    public Writable serialize(Object obj, ObjectInspector objectInspector) throws SerDeException {
        StructObjectInspector soi = (StructObjectInspector) objectInspector;
        List<? extends StructField> structFieldList = soi.getAllStructFieldRefs();
        List<Object> datalist = soi.getStructFieldsDataAsList(obj);

        if (structFieldList.size() != columnNames.size()) {
            throw new SerDeException("serialize解析出的字段个数 不等于 预定义的字段个数");
        }

        serializeStream.reset();
        for (int i = 0; i < structFieldList.size(); i++) {
            // 必要的时候,写入分隔符
            if (i > 0) {
                try {
                    serializeStream.write(FIELD_SEP.getBytes());
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
            // 获取当前这个字段的ObjectInspector
            ObjectInspector foi = structFieldList.get(i).getFieldObjectInspector();
            Object f = (datalist == null ? null : datalist.get(i));
            // 遇到是字段是null的,就写入hadoop默认的空字符
            if (f == null) {
                serializeStream.write(NULL_STRING.getBytes(), 0, NULL_STRING.getLength());
            } else {
                // demo里面只处理原始数据类型的 int long String
                if (foi.getCategory() == ObjectInspector.Category.PRIMITIVE) {
                    PrimitiveObjectInspector.PrimitiveCategory category = ((PrimitiveObjectInspector) (foi)).getPrimitiveCategory();
                    switch (category) {
                        case INT: {
                            try {
                                LazyInteger.writeUTF8(serializeStream, ((IntObjectInspector) foi).get(f));
                            } catch (IOException e) {
                                e.printStackTrace();
                            }
                            break;
                        }
                        case LONG: {
                            try {
                                LazyLong.writeUTF8(serializeStream, ((LongObjectInspector) foi).get(f));
                            } catch (IOException e) {
                                e.printStackTrace();
                            }
                            break;
                        }
                        case STRING: {
                            Text t = ((StringObjectInspector) foi).getPrimitiveWritableObject(f);
                            serializeStream.write(t.getBytes(), 0, t.getLength());
                            break;
                        }
                    }
                }
            }
        }
        serializeCache.set(serializeStream.getData(), 0, serializeStream.getLength());
        return serializeCache;
    }

    // HDFS files –> InputFileFormat –> <key, value> –> Deserializer –> Row object
    // Deserialize a row from the Writable to a LazyObject
    @Override
    public Object deserialize(Writable writable) throws SerDeException {
        List<Object> row = Lists.newArrayList();
        logger.info(writable.toString());
        Text text = (Text) writable;
        String line = text.toString();
        String[] fieldValueArray = line.split(FIELD_SEP);

        // 如果从当前行解析出来的字段个数不等于约定的字段个数，就返回null，不做处理
        if (fieldValueArray.length != columnNames.size()) {
            logger.warn("the num of fields not equal to the size of column names");
            return null;
        }
        // 根据Inspector，得到每一列数据 原有的数据类型
        for (int i = 0; i < columnNames.size(); i++) {
//            String columnName = columnNames.get(i);
            TypeInfo columnType = columnTypes.get(i);
            Object obj = null;
            if (columnType.getCategory() == ObjectInspector.Category.PRIMITIVE) {
                PrimitiveTypeInfo p_type_info = (PrimitiveTypeInfo) columnType;
                String value = fieldValueArray[i];
                switch (p_type_info.getPrimitiveCategory()) {
                    case STRING:
                        obj = StringUtils.defaultString(value, "");
                        break;
                    case LONG:
                        obj = Long.parseLong(value);
                        break;
                    case INT:
                        obj = Integer.valueOf(value);
                        break;
                }
            }
            row.add(obj);
        }
        return row;
    }

    // 序列化之后，返回给OutPutFormat的Writable对象，每一个Writable是一行数据
    @Override
    public Class<? extends Writable> getSerializedClass() {
        return Text.class;
    }

    @Override
    public SerDeStats getSerDeStats() {
        return null;
    }

    @Override
    public ObjectInspector getObjectInspector() throws SerDeException {
        return objectInspector;
    }

}
```





