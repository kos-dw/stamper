import { beforeEach, describe, expect, test, vi } from "vitest";
import { Stamper } from "~/Stamper";

describe("Stamperの動作テスト", () => {
    let stamper: Stamper;
    let rootEl: HTMLElement;
    let crateEl: HTMLElement;
    let addBtn: HTMLButtonElement;

    // confirmのモック
    const confirmSpy = vi.spyOn(window, "confirm");
    confirmSpy.mockReturnValue(true);

    // alertのモック
    const alertSpy = vi.spyOn(window, "alert");
    alertSpy.mockImplementation(() => vi.fn());

    beforeEach(() => {
        document.body.innerHTML = `
            <section class="container mx-auto" stamper="mock">
                <button
                    aria-label="要素の追加"
                    type="button"
                    s-cast="mock"
                    s-preadd='alert("preadd")'
                    s-postadd='alert("postadd")'
                >
                    追加
                </button>
                <template s-temp="mock">
                    <div s-sequence="0">連番</div>
                    <div name="{{index}}" s-index="name">タイトル</div>
                    <button
                        type="button"
                        s-delete="mock"
                        s-predelete='alert("predelete")'
                        s-postdelete='alert("postdelete")'
                    >
                        削除
                    </button>
                </template>
                <div s-crate="mock"></div>
            </section>
        `;

        // テスト対象の要素を取得
        rootEl = document.querySelector("[stamper=mock]") as HTMLElement;
        crateEl = rootEl.querySelector("[s-crate=mock]") as HTMLElement;
        addBtn = rootEl.querySelector("[s-cast=mock]") as HTMLButtonElement;

        // テスト対象のクラスを初期化
        stamper = new Stamper({ rootEl });
        stamper.init();
    });

    test("初期化時にエラーが発生しない", () => {
        expect(() => stamper.init()).not.toThrow();
    });

    test("初期レンダリング時に、rootEl、crateEl、addBtnが存在する", () => {
        expect(rootEl).not.toBeNull();
        expect(crateEl).not.toBeNull();
        expect(addBtn).not.toBeNull();
    });

    test("[s-cast]をクリックしたら要素が追加されている", () => {
        const children = crateEl.children;
        const beforeElLength = children.length;
        addBtn.click();
        const afterElLength = children.length;
        expect(afterElLength > beforeElLength).toBeTruthy();
    });

    test("[s-delete]をクリックしたら要素が削除されている", () => {
        addBtn.click();
        const deleteBtn = crateEl.querySelector(
            "[s-delete]"
        ) as HTMLButtonElement;
        expect(deleteBtn).not.toBeNull();

        deleteBtn.click();
        expect(crateEl.innerHTML).not.toBe("");
    });

    test("[s-sequence]の要素内が[1]スタートでの連番になっている", () => {
        let sequenceEls: NodeListOf<HTMLElement>;

        addBtn.click();
        sequenceEls = crateEl.querySelectorAll("[s-sequence]");

        expect(sequenceEls[0].innerHTML).toBe("1");

        addBtn.click();
        sequenceEls = crateEl.querySelectorAll("[s-sequence]");
        expect(sequenceEls[1].innerHTML).toBe("2");
    });

    test("[s-index]の対象の属性値の{{index}}が[0]スタートでの連番になっている", () => {
        let indexEls: NodeListOf<HTMLElement>;
        const modifier = "name";

        addBtn.click();
        indexEls = crateEl.querySelectorAll(`[s-index=${modifier}]`);
        expect(indexEls[0]).not.toBeNull();
        expect(indexEls[0].getAttribute(modifier)).toBe("0");

        addBtn.click();
        indexEls = crateEl.querySelectorAll(`[s-index=${modifier}]`);
        expect(indexEls[1]).not.toBeNull();
        expect(indexEls[1].getAttribute(modifier)).toBe("1");
    });

    test("[s-preadd]と[s-postadd]が機能している", () => {
        addBtn.click();
        expect(alertSpy).toHaveBeenCalledWith("preadd");
        expect(alertSpy).toHaveBeenCalledWith("postadd");
    });

    test("[s-predelete]と[s-postdelete]が機能している", () => {
        addBtn.click();
        const deleteBtn = crateEl.querySelector(
            "[s-delete]"
        ) as HTMLButtonElement;
        deleteBtn.click();
        expect(alertSpy).toHaveBeenCalledWith("predelete");
        expect(alertSpy).toHaveBeenCalledWith("postdelete");
    });
});
