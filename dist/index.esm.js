// src/errors/index.ts
var StamperError = class extends Error {
  static {
    this.prototype.name = "StamperError";
  }
};

// src/Stamper.ts
var Stamper = class {
  template;
  castElement;
  currentIndex;
  /**
   * Stamperのインスタンスを作成します。
   * @param {Object} params - コンストラクタのパラメータ。
   * @param {HTMLTemplateElement} params.tempEl - 使用するテンプレート要素。
   */
  constructor({ tempEl }) {
    this.template = tempEl;
    this.currentIndex = 0;
    this.castElement = null;
  }
  /**
   * クリックイベントを設定してStamperを初期化します。
   * @throws {StamperError} キャスト要素が見つからない場合。
   */
  init() {
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
  addItemWithSlot(data) {
    try {
      this.validateTemplateAndCast();
      const fragment = this.createFragment();
      this.populateSlots(fragment, data);
      this.castElement.before(fragment);
    } catch (error) {
      this.handleError(error);
    }
  }
  /**
   * キャスト要素にクリックイベントを設定します。
   * @private
   * @throws {StamperError} キャスト要素が見つからない場合。
   */
  setupClickEvent() {
    const key = this.template.getAttribute("s-temp");
    this.castElement = document.querySelector(`[s-cast=${key}]`);
    if (!this.castElement)
      throw new StamperError("\u30AD\u30E3\u30B9\u30C8\u8981\u7D20\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3002");
    this.castElement.addEventListener("click", (event) => {
      try {
        const self = event.currentTarget;
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
  createFragment() {
    const fragment = this.template.content.cloneNode(
      true
    );
    this.addIndexToFragment(fragment);
    return fragment;
  }
  /**
   * フラグメントにインデックスを追加します。
   * @private
   * @param {DocumentFragment} fragment - インデックスを追加するフラグメント。
   */
  addIndexToFragment(fragment) {
    const indexElement = fragment.querySelector("[s-index]");
    if (indexElement) {
      const el = indexElement;
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
  generateIndex(target) {
    const paddingNum = target.getAttribute("s-index");
    if (!paddingNum)
      throw new StamperError("s-index\u5C5E\u6027\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3002");
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
  zeroPad(numString, length) {
    return numString.padStart(length, "0");
  }
  /**
   * 提供されたデータでフラグメントのスロットを埋めます。
   * @private
   * @param {DocumentFragment} fragment - スロットを埋めるフラグメント。
   * @param {Object} data - スロットを埋めるためのデータ。
   */
  populateSlots(fragment, data) {
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
  validateTemplateAndCast() {
    if (!this.template)
      throw new StamperError("\u30C6\u30F3\u30D7\u30EC\u30FC\u30C8\u8981\u7D20\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3002");
    if (!this.castElement)
      throw new StamperError("\u30AD\u30E3\u30B9\u30C8\u8981\u7D20\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3002");
  }
  /**
   * エラーを処理し、コンソールにログを出力します。
   * @private
   * @param {unknown} error - 処理するエラー。
   */
  handleError(error) {
    console.error(error);
  }
};
export {
  Stamper
};
