import { StamperError } from "~/errors";

class Stamper {
    private template: HTMLTemplateElement;
    private castElement: HTMLElement | null;
    private currentIndex: number;

    /**
     * Stamperのインスタンスを作成します。
     * @param {Object} params - コンストラクタのパラメータ。
     * @param {HTMLTemplateElement} params.tempEl - 使用するテンプレート要素。
     */
    constructor({ tempEl }: { tempEl: HTMLTemplateElement }) {
        this.template = tempEl;
        this.currentIndex = 0;
        this.castElement = null;
    }

    /**
     * クリックイベントを設定してStamperを初期化します。
     * @throws {StamperError} キャスト要素が見つからない場合。
     */
    public init(): void {
        try {
            this.setupClickEvent();
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * 提供されたデータでスロットを埋めてアイテムを追加します。
     * @param {Object} data - スロットを埋めるためのデータ。
     * @throws {StamperError} テンプレートまたはキャスト要素が見つからない場合。
     */
    public addItemWithSlot(data: { [key: string]: string }): void {
        try {
            this.validateTemplateAndCast();
            const fragment = this.createFragment();
            this.populateSlots(fragment, data);
            this.castElement!.before(fragment);
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * キャスト要素にクリックイベントを設定します。
     * @private
     * @throws {StamperError} キャスト要素が見つからない場合。
     */
    private setupClickEvent(): void {
        const key = this.template.getAttribute("s-temp");
        this.castElement = document.querySelector(`[s-cast=${key}]`);
        if (!this.castElement)
            throw new StamperError("キャスト要素が見つかりません。");

        this.castElement.addEventListener("click", (event) => {
            try {
                const self = event.currentTarget as HTMLButtonElement;
                const fragment = this.createFragment();
                self.before(fragment);
            } catch (error) {
                this.handleError(error);
            }
        });
    }

    /**
     * テンプレートの内容からドキュメントフラグメントを作成します。
     * @private
     * @returns {DocumentFragment} 作成されたドキュメントフラグメント。
     */
    private createFragment(): DocumentFragment {
        const fragment = this.template.content.cloneNode(
            true
        ) as DocumentFragment;
        this.addIndexToFragment(fragment);
        return fragment;
    }

    /**
     * フラグメントにインデックスを追加します。
     * @private
     * @param {DocumentFragment} fragment - インデックスを追加するフラグメント。
     */
    private addIndexToFragment(fragment: DocumentFragment): void {
        const indexElement = fragment.querySelector("[s-index]");
        if (indexElement) {
            const el = indexElement as HTMLElement;
            el.textContent = this.generateIndex(el);
        }
    }

    /**
     * ゼロパディングされたインデックス文字列を生成します。
     * @private
     * @param {HTMLElement} target - パディング番号を取得するターゲット要素。
     * @returns {string} 生成されたインデックス文字列。
     * @throws {StamperError} s-index属性が見つからない場合。
     */
    private generateIndex(target: HTMLElement): string {
        const paddingNum = target.getAttribute("s-index");
        if (!paddingNum)
            throw new StamperError("s-index属性が見つかりません。");

        const digit = (paddingNum.match(/0/g) || []).length;
        const indexString = (++this.currentIndex).toString();
        return this.zeroPad(indexString, digit);
    }

    /**
     * 数字文字列をゼロパディングします。
     * @private
     * @param {string} numString - パディングする数字文字列。
     * @param {number} length - パディングする長さ。
     * @returns {string} パディングされた数字文字列。
     */
    private zeroPad(numString: string, length: number): string {
        return numString.padStart(length, "0");
    }

    /**
     * 提供されたデータでフラグメントのスロットを埋めます。
     * @private
     * @param {DocumentFragment} fragment - スロットを埋めるフラグメント。
     * @param {Object} data - スロットを埋めるためのデータ。
     */
    private populateSlots(
        fragment: DocumentFragment,
        data: { [key: string]: string }
    ): void {
        Object.keys(data).forEach((key) => {
            const slot = fragment.querySelector(`[s-slot=${key}]`);
            if (slot) slot.textContent = data[key];
        });
    }

    /**
     * テンプレートとキャスト要素が存在することを確認します。
     * @private
     * @throws {StamperError} テンプレートまたはキャスト要素が見つからない場合。
     */
    private validateTemplateAndCast(): void {
        if (!this.template)
            throw new StamperError("テンプレート要素が見つかりません。");
        if (!this.castElement)
            throw new StamperError("キャスト要素が見つかりません。");
    }

    /**
     * エラーを処理し、コンソールにログを出力します。
     * @private
     * @param {unknown} error - 処理するエラー。
     */
    private handleError(error: unknown): void {
        console.error(error);
    }
}

export { Stamper };
