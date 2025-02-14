import { JSDOM } from "jsdom";
import fs from "node:fs";
import path from "node:path";
import type { MockInstance } from "vitest";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";
import { Stamper } from "~/Stamper";

// 定数定義
const HTML_FILEPATH = path.resolve(
  __dirname,
  "../dist/mock/index.html",
);
const IDENTIFIER = "mock";

// テストスイート
describe("Stamperの動作テスト", () => {
  let rootEl: HTMLElement;
  let tempEl: HTMLTemplateElement;
  let crateEl: HTMLElement;
  let addBtn: HTMLButtonElement;



  // ポップアップの動作をモック化
  const confirmSpy: MockInstance = vi
    .spyOn(window, "confirm")
    .mockReturnValue(true);
  const alertSpy: MockInstance = vi
    .spyOn(window, "alert")
    .mockImplementation(() => vi.fn());

  beforeEach(() => {

    // テスト対象のHTMLテキストを取得する
    const html = fs.readFileSync(HTML_FILEPATH, "utf-8");
    const dom = new JSDOM(html);
    const stamperElementText = dom.window.document.body.querySelector(
      `[stamper=${IDENTIFIER}]`,
    )?.outerHTML as string;

    // テスト対象のHTMLをbodyに追加
    document.body.innerHTML = stamperElementText;

    // テスト対象の要素を取得
    rootEl = document.querySelector(
      `[stamper=${IDENTIFIER}]`,
    ) as HTMLElement;
    tempEl = rootEl.querySelector(
      `[s-temp=${IDENTIFIER}]`,
    ) as HTMLTemplateElement;
    crateEl = rootEl.querySelector(
      `[s-crate=${IDENTIFIER}]`,
    ) as HTMLElement;
    crateEl = rootEl.querySelector(
      `[s-crate=${IDENTIFIER}]`,
    ) as HTMLElement;
    addBtn = rootEl.querySelector(
      `[s-cast=${IDENTIFIER}]`,
    ) as HTMLButtonElement;
  });

  afterEach(() => {
    // ダイアログのモックをクリア
    confirmSpy.mockClear();
    alertSpy.mockClear();

    // テスト対象の要素をクリア
    document.body.innerHTML = "";
  });

  test("初期レンダリング時に、rootEl、crateEl、addBtnが存在する", () => {
    expect(rootEl).not.toBeNull();
    expect(tempEl).not.toBeNull();
    expect(crateEl).not.toBeNull();
    expect(addBtn).not.toBeNull();
  });

  test("初期化時にエラーが発生しない", () => {
    const stamper = new Stamper({ rootEl });
    expect(() => stamper.init()).not.toThrow();
  });

  test("初期化後に属性値が追加されている", () => {
    const stamper = new Stamper({ rootEl });
    stamper.init();
    expect(rootEl.hasAttribute("s-inited")).toBeTruthy();
  });

  test("postinitが動作している", () => {
    const stamper = new Stamper({ rootEl });
    stamper.addPostInit(() => {
      alert("postinit");
    });
    stamper.init();
    expect(alertSpy).toHaveBeenNthCalledWith(1, "postinit");
  });

  test("[s-cast]をクリックしたら要素が追加されている", () => {
    const stamper = new Stamper({ rootEl });
    stamper.init();
    const children = crateEl.children;
    const beforeElLength = children.length;
    addBtn.click();
    const afterElLength = children.length;
    expect(afterElLength > beforeElLength).toBeTruthy();
  });

  test("[s-delete]をクリックしたら要素が削除されている", () => {
    const stamper = new Stamper({ rootEl });
    stamper.init();
    addBtn.click();

    Array.from(crateEl.children).forEach((child) => {
      const deleteBtn = child.querySelector(
        "[s-delete]",
      ) as HTMLButtonElement;
      deleteBtn.click();
    });

    expect(crateEl.children.length).toBe(0);
  });

  test("[s-crate]内に直接マークアップされている場合、それらの要素の[s-sequence]が連番になっている", () => {
    const stamper = new Stamper({ rootEl });
    stamper.init();
    let sequenceEls: NodeListOf<HTMLElement>;

    sequenceEls = crateEl.querySelectorAll("[s-sequence]");

    sequenceEls.forEach((el, index) => {
      expect(el.innerHTML).toBe((index + 1).toString());
    });
  });

  test("[s-sequence]の要素内が[1]スタートでの連番になっている", () => {
    const stamper = new Stamper({ rootEl });
    stamper.init();
    let sequenceEls: NodeListOf<HTMLElement>;

    addBtn.click();

    Array.from(crateEl.children).forEach((child, index) => {
      const sequenceEls = child.querySelectorAll("[s-sequence]");
      sequenceEls.forEach((sequenceEl) => {
        expect(sequenceEl.innerHTML).toBe((index + 1).toString());
      });
    });
  });

  test("[s-index]の対象の属性値の{{index}}が[0]スタートでの連番になっている", () => {

    const stamper = new Stamper({ rootEl });
    stamper.init();

    addBtn.click();

    Array.from(crateEl.children).forEach((child, index) => {
      
      const indexEls = child.querySelectorAll(`[s-index]`);
      indexEls.forEach((indexEl) => {
        expect(indexEl.getAttribute("normal")).toBe(index.toString());
        expect(indexEl.getAttribute("increment")).toBe(( index + 1 ).toString());
        expect(indexEl.getAttribute("x-dropdown-index")).toBe(( index - 1).toString());
      });
    });
  });

  test("[s-preadd]と[s-postadd]が機能している", () => {
    const stamper = new Stamper({ rootEl });
    stamper.init();

    alertSpy.mockClear();
    addBtn.click();
    expect(alertSpy).toHaveBeenNthCalledWith(1, "preadd");
    expect(alertSpy).toHaveBeenNthCalledWith(2, "postadd");
  });

  test("[s-predelete]と[s-postdelete]が機能している", () => {
    const stamper = new Stamper({ rootEl });
    stamper.init();
    addBtn.click();

    Array.from(crateEl.children).forEach((child, index) => {
      const deleteBtn = child.querySelector(
        "[s-delete]",
      ) as HTMLButtonElement;
      alertSpy.mockClear();
      deleteBtn.click();
      expect(alertSpy).toHaveBeenNthCalledWith(1, "predelete");
      expect(alertSpy).toHaveBeenNthCalledWith(2, "postdelete");
    });
  });
});
