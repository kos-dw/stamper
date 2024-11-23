import { DIRECTIVE_VALUES } from "~/constants";
import { StamperError } from "~/errors";

class Stamper {
    private stamperArea: HTMLElement;
    private tempEl: HTMLTemplateElement | null;
    private castEl: HTMLElement | null;
    private crateEl: HTMLElement | null;
    private currentIndex: number;
    private callback: (children: HTMLElement[]) => void;

    /**
     * Stamperのインスタンスを作成します。
     * @param {Object} params - コンストラクタのパラメータ。
     * @param {HTMLElement} params.stamperArea - 使用するスタンパーエリア。
     */
    constructor({ stamperArea }: { stamperArea: HTMLElement }) {
        this.stamperArea = stamperArea;
        this.currentIndex = 0;
        this.tempEl = null;
        this.castEl = null;
        this.crateEl = null;
        this.callback = () => {};
    }

    /**
     * エラーを処理し、コンソールにログを出力します。
     * @private
     * @param {unknown} error - 処理するエラー。
     */
    private handleError(error: unknown): void {
        if (error instanceof StamperError) {
            console.warn(error.message);
        } else {
            console.error(error);
        }
    }

    /**
     * 指定されたディレクティブと識別子に基づいて要素をクエリします。
     * @private
     * @param {string} directive - ディレクティブ。
     * @param {string | null} identifier - 識別子。
     * @returns {HTMLElement | null} クエリされた要素。
     */
    private queryElement(
        directive: string,
        identifier: string | null
    ): HTMLElement {
        if (!identifier) throw new StamperError("Missing identifier.");
        const element = this.stamperArea.querySelector(
            `[${directive}="${identifier}"]`
        ) as HTMLElement;
        if (!element) throw new StamperError(`Missing element. [${directive}]`);
        return element;
    }

    /**
     * キャスト要素にクリックイベントを設定します。
     * @private
     * @throws {StamperError} キャスト要素が見つからない場合。
     */
    private setupClickEvent(): void {
        if (!this.tempEl || !this.castEl || !this.crateEl) {
            throw new StamperError(
                `Missing elements. [${DIRECTIVE_VALUES.temp}|${DIRECTIVE_VALUES.cast}|${DIRECTIVE_VALUES.crate}]`
            );
        }

        this.castEl.addEventListener("click", (event) => {
            try {
                const fragment = this.createFragment();
                this.addIndex(fragment);
                const children = Array.from(fragment.children) as HTMLElement[];
                if (!this.crateEl)
                    throw new StamperError(
                        `Missing elements. [${DIRECTIVE_VALUES.crate}]`
                    );
                this.crateEl.appendChild(fragment);

                if (this.callback) {
                    this.callback(children);
                }

                this.setupDeleteEvent(children);
                this.currentIndex++;
            } catch (error) {
                this.handleError(error);
            }
        });
    }

    /**
     * 削除イベントを設定します。
     * @private
     * @param {HTMLElement[]} children - 子要素の配列。
     */
    private setupDeleteEvent(children: HTMLElement[]): void {
        const deleteEl = children.reduce((prev, curr) => {
            if (curr.hasAttribute(DIRECTIVE_VALUES.delete)) {
                prev.push(curr);
            } else {
                const delEl = curr.querySelector(
                    `[${DIRECTIVE_VALUES.delete}]`
                );
                if (delEl) prev.push(delEl as HTMLElement);
            }
            return prev;
        }, [] as HTMLElement[])[0];

        if (deleteEl && children.length > 0) {
            deleteEl.addEventListener("click", (event: MouseEvent) => {
                if (!(event.currentTarget instanceof HTMLButtonElement))
                    throw new StamperError("Invalid element.");
                const ariaLabel =
                    event.currentTarget.getAttribute("aria-label") ||
                    "Delete element";
                if (window.confirm(`以下の処理を実行します\n- ${ariaLabel}`)) {
                    children.forEach((child) => {
                        child.remove();
                    });
                }
            });
        }
    }

    /**
     * フラグメントにインデックスを追加します。
     * @private
     * @param {DocumentFragment} fragment - インデックスを追加するフラグメント。
     */
    private addIndex(fragment: DocumentFragment): void {
        const indexEls = fragment.querySelectorAll(
            `[${DIRECTIVE_VALUES.index}]`
        );
        indexEls.forEach((indexEl) => {
            const targetAttrKeys = indexEl.getAttribute(
                `${DIRECTIVE_VALUES.index}`
            );
            if (targetAttrKeys) {
                const targetAttrKeysArray = targetAttrKeys.split(",");
                targetAttrKeysArray.forEach((targetAttrKey) => {
                    const targetAttrValue = indexEl
                        .getAttribute(targetAttrKey)
                        ?.replace(/{{index}}/gi, this.currentIndex.toString())
                        .replace(
                            /{{index\+\+}}/gi,
                            (this.currentIndex + 1).toString()
                        );
                    if (targetAttrValue) {
                        indexEl.setAttribute(targetAttrKey, targetAttrValue);
                    }
                });
            }
        });
    }

    /**
     * テンプレートの内容からドキュメントフラグメントを作成します。
     * @private
     * @returns {DocumentFragment} 作成されたドキュメントフラグメント。
     */
    private createFragment(): DocumentFragment {
        const fragment = this.tempEl!.content.cloneNode(
            true
        ) as DocumentFragment;
        this.addSequenceToFragment(fragment);
        return fragment;
    }

    /**
     * フラグメントにシーケンスを追加します。
     * @private
     * @param {DocumentFragment} fragment - シーケンスを追加するフラグメント。
     */
    private addSequenceToFragment(fragment: DocumentFragment): void {
        const sequenceEls = fragment.querySelectorAll(
            `[${DIRECTIVE_VALUES.sequence}]`
        );
        sequenceEls.forEach((sequenceEl) => {
            sequenceEl.textContent = this.generateSequence(
                sequenceEl as HTMLElement
            );
        });
    }

    /**
     * ゼロパディングされたインデックス文字列を生成します。
     * @private
     * @param {HTMLElement} target - パディング番号を取得するターゲット要素。
     * @returns {string} 生成されたインデックス文字列。
     * @throws {StamperError} s-sequence属性が見つからない場合。
     */
    private generateSequence(target: HTMLElement): string {
        const paddingNum = target.getAttribute(`${DIRECTIVE_VALUES.sequence}`);
        if (!paddingNum)
            throw new StamperError(
                `Missing attribute: ${DIRECTIVE_VALUES.sequence}.`
            );

        const digit = (paddingNum.match(/0/g) || []).length;
        const indexString = (this.currentIndex + 1).toString();
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
            const slot = fragment.querySelector(
                `[${DIRECTIVE_VALUES.slot}=${key}]`
            );
            if (slot) slot.textContent = data[key];
        });
    }

    /**
     * テンプレートとキャスト要素が存在することを確認します。
     * @private
     * @throws {StamperError} テンプレートまたはキャスト要素が見つからない場合。
     */
    private validateTemplateAndCast(): void {
        if (!this.tempEl) throw new StamperError("Template element not found.");
        if (!this.castEl) throw new StamperError("Cast element not found.");
    }

    /**
     * クリックイベントを設定してStamperを初期化します。
     * @throws {StamperError} キャスト要素が見つからない場合。
     */
    public init(): void {
        try {
            const identifier = this.stamperArea.getAttribute("stamper");
            const tempEl = this.queryElement(DIRECTIVE_VALUES.temp, identifier);
            if (tempEl instanceof HTMLTemplateElement) {
                this.tempEl = tempEl;
            } else {
                throw new StamperError(
                    `${DIRECTIVE_VALUES.temp} is invalid element.`
                );
            }
            this.castEl = this.queryElement(DIRECTIVE_VALUES.cast, identifier);
            this.crateEl = this.queryElement(
                DIRECTIVE_VALUES.crate,
                identifier
            );
            this.setupClickEvent();
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * コールバックを設定します。
     * @param {Function} callback - コールバック関数。
     */
    public addCallback(callback: (children: HTMLElement[]) => void): void {
        this.callback = callback;
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
            this.castEl!.before(fragment);
        } catch (error) {
            this.handleError(error);
        }
    }
}

export { Stamper };
