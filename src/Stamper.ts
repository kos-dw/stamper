import { DIRECTIVE_VALUES, NOT_ALLOWED_PATTERNS } from "~/constants";
import { StamperError } from "~/errors";

class Stamper {
  private rootEl: HTMLElement;
  private tempEl: HTMLTemplateElement | null;
  private castEl: HTMLElement | null;
  private crateEl: HTMLElement | null;
  private currentIndex: number;
  private identifier: string;
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
    const identifier = rootEl.getAttribute("stamper");
    if (!identifier) throw new StamperError("Missing identifier.");
    this.identifier = identifier;
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
   * 提供されたデータでスロットを埋めてアイテムを追加します。
   * @param {Object} data - スロットを埋めるためのデータ。
   * @throws {StamperError} テンプレートまたはキャスト要素が見つからない場合。
   */
  public addItemWithSlot(data: { [key: string]: string }): void {
    try {
      this.validateTemplateAndCast();
      const fragment = this.createFragment();
      this.populateSlots(fragment, data);
      const child = fragment.children[0] as HTMLElement;
      this.castEl!.before(fragment);
      this.setupDeleteEvent(child);
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
   * クリックイベントを設定してStamperを初期化します。
   * @throws {StamperError} キャスト要素が見つからない場合。
   */
  public init(): void {
    try {
      this.tempEl = this.validateTemplateElement(
        this.queryElement(DIRECTIVE_VALUES.temp, this.identifier),
      );
      this.castEl = this.queryElement(
        DIRECTIVE_VALUES.cast,
        this.identifier,
      );
      this.crateEl = this.queryElement(
        DIRECTIVE_VALUES.crate,
        this.identifier,
      );

      this.initializeCrateElements();
      this.setupClickEvent();
      this.rootEl.setAttribute("s-inited", "true");
      if (this.callback.postinit) this.callback.postinit();
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * フラグメントにインデックスを追加します。
   * @private
   * @param {DocumentFragment} fragment - インデックスを追加するフラグメント。
   */
  private addIndex(fragment: DocumentFragment): void {
    const indexEls = fragment.querySelectorAll(
      `[${DIRECTIVE_VALUES.index}]`,
    );
    indexEls.forEach((indexEl) => {
      const targetAttrKeys = indexEl.getAttribute(
        `${DIRECTIVE_VALUES.index}`,
      );
      if (targetAttrKeys) {
        const targetAttrKeysArray = targetAttrKeys.split(",");
        targetAttrKeysArray.forEach((targetAttrKey) => {
          const targetAttrValue = indexEl
            .getAttribute(targetAttrKey)
            ?.replace(/{{index}}/gi, this.currentIndex.toString())
            .replace(
              /{{index\+\+}}/gi,
              (this.currentIndex + 1).toString(),
            );
          if (targetAttrValue) {
            indexEl.setAttribute(targetAttrKey, targetAttrValue);
          }
        });
      }
    });
  }

  /**
   * 要素にシーケンスを追加します。
   * @private
   * @param {HTMLElement} element - シーケンスを追加する要素。
   */
  private addSequenceToElement(element: HTMLElement): void {
    const sequenceEls = element.querySelectorAll(
      `[${DIRECTIVE_VALUES.sequence}]`,
    );
    sequenceEls.forEach((sequenceEl) => {
      sequenceEl.textContent = this.generateSequence(
        sequenceEl as HTMLElement,
      );
    });
  }

  /**
   * フラグメントにシーケンスを追加します。
   * @private
   * @param {DocumentFragment} fragment - シーケンスを追加するフラグメント。
   */
  private addSequenceToFragment(fragment: DocumentFragment): void {
    const sequenceEls = fragment.querySelectorAll(
      `[${DIRECTIVE_VALUES.sequence}]`,
    );
    sequenceEls.forEach((sequenceEl) => {
      sequenceEl.textContent = this.generateSequence(
        sequenceEl as HTMLElement,
      );
    });
  }

  /**
   * テンプレートの内容からドキュメントフラグメントを作成します。
   * @private
   * @returns {DocumentFragment} 作成されたドキュメントフラグメント。
   */
  private createFragment(): DocumentFragment {
    const fragment = this.tempEl!.content.cloneNode(
      true,
    ) as DocumentFragment;
    this.addSequenceToFragment(fragment);
    return fragment;
  }

  /**
   * コード文字列から関数を生成します。
   * @private
   * @param {string} code - 関数のコード文字列。
   * @param {string[]} [params=[]] - 関数のパラメータ。
   * @returns {Function} 生成された関数。
   * @throws {StamperError} コードが見つからない場合、または許可されていないパターンが含まれている場合。
   */
  private createFunction(
    code: string,
    params: string[] = [],
  ): Function {
    if (!code) throw new StamperError("code is not found");
    if (NOT_ALLOWED_PATTERNS.some((pattern) => pattern.test(code)))
      throw new StamperError("Stamper is not work");

    return new Function(...params, `${code}`);
  }

  /**
   * コールバック関数を実行します。
   * @private
   * @param {string | null} callbackCode - コールバック関数のコード。
   * @param {HTMLElement} child - 子要素。
   * @param {Event} event - イベントオブジェクト。
   */
  private executeCallback(
    callbackCode: string | null,
    child: HTMLElement,
    event: Event,
  ): void {
    if (callbackCode) {
      this.createFunction(callbackCode, [
        "rootEl",
        "tempEl",
        "castEl",
        "crateEl",
        "child",
        "event",
      ])(
        this.rootEl,
        this.tempEl,
        this.castEl,
        this.crateEl,
        child,
        event,
      );
    }
  }

  /**
   * ゼロパディングされたインデックス文字列を生成します。
   * @private
   * @param {HTMLElement} target - パディング番号を取得するターゲット要素。
   * @returns {string} 生成されたインデックス文字列。
   * @throws {StamperError} s-sequence属性が見つからない場合。
   */
  private generateSequence(target: HTMLElement): string {
    const paddingNum = target.getAttribute(
      `${DIRECTIVE_VALUES.sequence}`,
    );
    if (!paddingNum)
      throw new StamperError(
        `Missing attribute: ${DIRECTIVE_VALUES.sequence}.`,
      );

    const digit = (paddingNum.match(/0/g) || []).length;
    const indexString = (this.currentIndex + 1).toString();
    return indexString.padStart(digit, "0");
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
   * スタンパーエリア内の既存の要素を初期化します。
   * @private
   */
  private initializeCrateElements(): void {
    if (this.crateEl!.children.length > 0) {
      Array.from(this.crateEl!.children).forEach((child) => {
        this.processChildElement(child as HTMLElement);
        this.currentIndex++;
      });
    }
  }

  /**
   * 提供されたデータでフラグメントのスロットを埋めます。
   * @private
   * @param {DocumentFragment} fragment - スロットを埋めるフラグメント。
   * @param {Object} data - スロットを埋めるためのデータ。
   */
  private populateSlots(
    fragment: DocumentFragment,
    data: { [key: string]: string },
  ): void {
    Object.keys(data).forEach((key) => {
      const slot = fragment.querySelector(
        `[${DIRECTIVE_VALUES.slot}=${key}]`,
      );
      if (slot) slot.textContent = data[key];
    });
  }

  /**
   * 子要素を処理します。
   * @private
   * @param {HTMLElement} child - 子要素。
   */
  private processChildElement(child: HTMLElement): void {
    this.addSequenceToElement(child);
    this.addIndex(child as unknown as DocumentFragment);
    this.setupDeleteEvent(child);
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
    identifier: string | null,
  ): HTMLElement {
    if (!identifier) throw new StamperError("Missing identifier.");
    const element = this.rootEl.querySelector(
      `[${directive}="${identifier}"]`,
    ) as HTMLElement;
    if (!element)
      throw new StamperError(`Missing element. [${directive}]`);
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
        `Missing elements. [${DIRECTIVE_VALUES.temp}|${DIRECTIVE_VALUES.cast}|${DIRECTIVE_VALUES.crate}]`,
      );
    }

    this.castEl.addEventListener("click", (event) => {
      try {
        const preadd = this.castEl!.getAttribute(
          DIRECTIVE_VALUES.preadd,
        );
        const postadd = this.castEl!.getAttribute(
          DIRECTIVE_VALUES.postadd,
        );

        const fragment = this.createFragment();
        this.addIndex(fragment);
        const child = fragment.children[0] as HTMLElement;

        this.executeCallback(preadd, child, event);
        this.crateEl!.appendChild(fragment);
        this.executeCallback(postadd, child, event);

        this.setupDeleteEvent(child);
        this.currentIndex++;
      } catch (error) {
        this.handleError(error);
      }
    });
  }

  /**
   * 削除イベントを設定します。
   * @private
   * @param {HTMLElement[]} child - 子要素の配列。
   */
  private setupDeleteEvent(child: HTMLElement): void {
    const deleteEl = child.querySelector(
      `[${DIRECTIVE_VALUES.delete}=${this.identifier}]`,
    );

    if (!(deleteEl instanceof HTMLButtonElement)) return;

    deleteEl.addEventListener("click", (event: MouseEvent) => {
      if (!(event.currentTarget instanceof HTMLButtonElement))
        throw new StamperError("Invalid element.");
      const ariaLabel =
        event.currentTarget.getAttribute("aria-label") ||
        "Delete element";
      const predelete = event.currentTarget.getAttribute(
        DIRECTIVE_VALUES.predelete,
      );
      const postdelete = event.currentTarget.getAttribute(
        DIRECTIVE_VALUES.postdelete,
      );
      if (window.confirm(`以下の処理を実行します\n- ${ariaLabel}`)) {
        const keys = [
          "rootEl",
          "tempEl",
          "castEl",
          "crateEl",
          "child",
          "event",
        ];
        const values = [
          this.rootEl,
          this.tempEl,
          this.castEl,
          this.crateEl,
          child,
          event,
        ];

        this.executeCallback(predelete, child, event);
        child.remove();
        this.executeCallback(postdelete, child, event);
      }
    });
    // }
  }

  /**
   * テンプレートとキャスト要素が存在することを確認します。
   * @private
   * @throws {StamperError} テンプレートまたはキャスト要素が見つからない場合。
   */
  private validateTemplateAndCast(): void {
    if (!this.tempEl)
      throw new StamperError("Template element not found.");
    if (!this.castEl) throw new StamperError("Cast element not found.");
  }

  /**
   * テンプレート要素を検証します。
   * @private
   * @param {HTMLElement} tempEl - 検証するテンプレート要素。
   * @returns {HTMLTemplateElement} 検証されたテンプレート要素。
   * @throws {StamperError} テンプレート要素が無効な場合。
   */
  private validateTemplateElement(
    tempEl: HTMLElement,
  ): HTMLTemplateElement {
    if (!(tempEl instanceof HTMLTemplateElement)) {
      throw new StamperError(
        `${DIRECTIVE_VALUES.temp} is invalid element.`,
      );
    }
    if (tempEl.content.children.length > 1) {
      throw new StamperError(
        "The template element must have only one child element.",
      );
    }
    return tempEl;
  }
}

export { Stamper };
