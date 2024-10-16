export type Directives = {
    data: string;
    text: string;
    model: string;
    bind: string;
    effect: string;
    on: string;
    ref: string;
};

export type RootState = {
    [key: string | symbol]: any;
};

// nodeTypeがNode.ELEMENT_NODEの場合はElementノードになるよう型ガード
export function isElementNode(node: Node): node is Element {
    return node.nodeType === Node.ELEMENT_NODE;
}

// tenplate要素かどうかの型ガード
export function isTemplateElement(node: Element): node is HTMLTemplateElement {
    return node.tagName === "TEMPLATE";
}
