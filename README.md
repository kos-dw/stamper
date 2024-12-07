# Stamper

Stamper は、指定されたテンプレートを使用して動的に要素を追加および削除するためのライブラリです。

```html
<section class="container mx-auto" stamper="mock">
    <div s-crate="mock"></div>

    <template s-temp="mock">
        <div s-sequence="000">連番</div>
        <div name="title{{index}}" s-index="name">タイトル</div>
        <div name="body{{index}}" s-index="name">コンテンツ</div>
        <button
            type="button"
            s-delete="mock"
            s-preDelete='console.log("preDelete")'
            s-postDelete='console.log("postDelete")'
            class="bg-red-700 w-36 p-1 text-white text-center"
        >
            削除
        </button>
    </template>

    <button
        type="button"
        s-cast="mock"
        s-preAdd='console.log("preAdd")'
        s-postAdd='console.log("postAdd")'
        class="bg-black w-36 p-2 text-white text-center"
    >
        追加
    </button>
</section>

<script type="module">
    import { Stamper } from "./js/index.esm.js";

    const rootEl = document.querySelector('[stamper="mock"]');
    const stamper = new Stamper({ rootEl });
    stamper.init();
</script>
```

## ディレクティブ

### stamper

`stamper` 属性は、スタンプの名前を指定します。スタンプは、`s-temp` 属性で指定されたテンプレートを使用して要素を追加および削除します。

### s-temp

`stamper` 属性で指定されたスタンプに使用されるテンプレートを指定します。

### s-crate

`stamper` 属性で指定されたスタンプに要素を追加するためのコンテナを指定します。

### s-sequence

`stamper` 属性で指定されたスタンプに要素を追加するための連番を指定します。属性値に 0 埋めされた数値が使用されます。

```html
例:
<div s-sequence="000"></div>
<!--
`s-sequence="000"` であれば、`000`、`001`、`002` といった連番が使用されます。
expect
<div s-sequence="000">001</div>
<div s-sequence="000">002</div>
<div s-sequence="000">003</div>
...
-->
```

### s-index

`s-index` 属性で指定した属性値に記載する識別子をインデックスに置き換えます。カンマ区切りで複数の属性値を指定することができます。

-   `{{index}}` : インデックス  
    インデックス値に置き換わります。
-   `{{index++}}` : インデックス+1  
    インデックス値に 1 を加算した値に置き換わります。

```html
例:
<div
    title="title{{index}}"
    aria-label="スタンパー{{index++}}"
    s-index="name,aria-label"
></div>
<!--
`s-index="name,aria-label"` であれば、`title` と `aria-label` 属性にインデックスが追加されます。
expect
<div title="title0" aria-label="スタンパー1"></div>
<div title="title1" aria-label="スタンパー2"></div>
<div title="title2" aria-label="スタンパー3"></div>
...
-->
```

### s-delete

`stamper` 属性で指定されたスタンプに要素を削除するためのボタンを指定します。

### s-cast

`stamper` 属性で指定されたスタンプに要素を追加するためのボタンを指定します。
