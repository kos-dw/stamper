import { DIRECTIVE_VALUES, NOT_ALLOWED_PATTERNS } from "~/constants";
import { StamperError } from "~/errors";

class Stamper {
  private rootEl: HTMLElement;
  private tempEl: HTMLTemplateElement | null;
  private castEl: HTMLElement | null;
  private crateEl: HTMLElement | null;
  private currentIndex: number;
  private callback: {
    postinit: (() => void) | null;
    preadd: ((...args: any[]) => void) | null;
    postadd: ((...args: any[]) => void) | null;
    predelete: ((...args: any[]) => void) | null;
    postdelete: ((...args: any[]) => void) | null;
  };

  /**
   * Stamperのインスタンスを作成します。
   * @param {Object} params - コンストラクタのパラメータ。
   * @param {HTMLElement} params.rootEl - 使用するスタンパーエリア。
   */
  constructor({ rootEl }: { rootEl: HTMLElement }) {
    this.rootEl = rootEl;
    this.currentIndex = 0;
    this.tempEl = null;
    this.castEl = null;
    this.crateEl = null;
    this.callback = {
      postinit: null,
      preadd: null,
      postadd: null,
      predelete: null,
      postdelete: null,
    };
  }

  /**
   * クリックイベントを設定してStamperを初期化します。
   * @throws {StamperError} キャスト要素が見つからない場合。
   */
  public init(): void {
    try {
      const identifier = this.rootEl.getAttribute("stamper");
      const tempEl = this.queryElement(DIRECTIVE_VALUES.temp, identifier);
      if (tempEl instanceof HTMLTemplateElement) {
        this.tempEl = tempEl;
      } else {
        throw new StamperError(`${DIRECTIVE_VALUES.temp} is invalid element.`);
      }
      this.castEl = this.queryElement(DIRECTIVE_VALUES.cast, identifier);
      this.crateEl = this.queryElement(DIRECTIVE_VALUES.crate, identifier);
      this.setupClickEvent();

      this.rootEl.setAttribute("s-inited", "true");
      // 初期化後のコールバック
      if (this.callback.postinit) this.callback.postinit();
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
      const children = Array.from(fragment.children) as HTMLElement[];
      this.castEl!.before(fragment);
      this.setupDeleteEvent(children);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * 初期化後のコールバックを設定します。
   * @param {Function} callback - コールバック関数。
   */
  public addPostInit(callback: typeof this.callback.postinit) {
    this.callback.postinit = callback;
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
    const element = this.rootEl.querySelector(
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
        const preadd = this.castEl!.getAttribute(DIRECTIVE_VALUES.preadd);
        const postadd = this.castEl!.getAttribute(DIRECTIVE_VALUES.postadd);

        const fragment = this.createFragment();
        this.addIndex(fragment);
        const children = Array.from(fragment.children) as HTMLElement[];

        // 要素追加前のコールバック
        if (preadd) {
          this.createFunction(preadd, [
            "rootEl",
            "tempEl",
            "castEl",
            "crateEl",
            "children",
            "event",
          ])(
            this.rootEl,
            this.tempEl,
            this.castEl,
            this.crateEl,
            children,
            event
          );
        }

        if (!this.crateEl)
          throw new StamperError(
            `Missing elements. [${DIRECTIVE_VALUES.crate}]`
          );
        this.crateEl.appendChild(fragment);

        // 要素追加後のコールバック
        if (postadd) {
          this.createFunction(postadd, [
            "rootEl",
            "tempEl",
            "castEl",
            "crateEl",
            "children",
            "event",
          ])(
            this.rootEl,
            this.tempEl,
            this.castEl,
            this.crateEl,
            children,
            event
          );
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
        const delEl = curr.querySelector(`[${DIRECTIVE_VALUES.delete}]`);
        if (delEl) prev.push(delEl as HTMLElement);
      }
      return prev;
    }, [] as HTMLElement[])[0];

    if (deleteEl && children.length > 0) {
      deleteEl.addEventListener("click", (event: MouseEvent) => {
        if (!(event.currentTarget instanceof HTMLButtonElement))
          throw new StamperError("Invalid element.");
        const ariaLabel =
          event.currentTarget.getAttribute("aria-label") || "Delete element";
        const predelete = event.currentTarget.getAttribute(
          DIRECTIVE_VALUES.predelete
        );
        const postdelete = event.currentTarget.getAttribute(
          DIRECTIVE_VALUES.postdelete
        );
        if (window.confirm(`以下の処理を実行します\n- ${ariaLabel}`)) {
          const keys = [
            "rootEl",
            "tempEl",
            "castEl",
            "crateEl",
            "children",
            "event",
          ];
          const values = [
            this.rootEl,
            this.tempEl,
            this.castEl,
            this.crateEl,
            children,
            event,
          ];

          // 要素削除前のコールバック
          if (predelete) {
            this.createFunction(predelete, keys)(...values);
          }

          children.forEach((child) => {
            child.remove();
          });

          // 要素削除後のコールバック
          if (postdelete) {
            this.createFunction(postdelete, keys)(...values);
          }
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
    const indexEls = fragment.querySelectorAll(`[${DIRECTIVE_VALUES.index}]`);
    indexEls.forEach((indexEl) => {
      const targetAttrKeys = indexEl.getAttribute(`${DIRECTIVE_VALUES.index}`);
      if (targetAttrKeys) {
        const targetAttrKeysArray = targetAttrKeys.split(",");
        targetAttrKeysArray.forEach((targetAttrKey) => {
          const targetAttrValue = indexEl
            .getAttribute(targetAttrKey)
            ?.replace(/{{index}}/gi, this.currentIndex.toString())
            .replace(/{{index\+\+}}/gi, (this.currentIndex + 1).toString());
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
    const fragment = this.tempEl!.content.cloneNode(true) as DocumentFragment;
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
      sequenceEl.textContent = this.generateSequence(sequenceEl as HTMLElement);
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
      const slot = fragment.querySelector(`[${DIRECTIVE_VALUES.slot}=${key}]`);
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
   * コード文字列から関数を生成します。
   * @private
   * @param {string} code - 関数のコード文字列。
   * @param {string[]} [params=[]] - 関数のパラメータ。
   * @returns {Function} 生成された関数。
   * @throws {StamperError} コードが見つからない場合、または許可されていないパターンが含まれている場合。
   */
  private createFunction(code: string, params: string[] = []): Function {
    if (!code) throw new StamperError("code is not found");
    if (NOT_ALLOWED_PATTERNS.some((pattern) => pattern.test(code)))
      throw new StamperError("Stamper is not work");

    return new Function(...params, `${code}`);
  }
}

export { Stamper };
