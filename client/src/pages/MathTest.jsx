import React, { useState } from 'react';
import RichTextEditor from '../components/RichTextEditor';
import MarkdownRenderer from '../components/MarkdownRenderer';

const MathTest = () => {
    const [content, setContent] = useState(`# LaTeX 公式测试

## 行内公式示例

这是一个简单的行内公式: $E = mc^2$

爱因斯坦的质能方程 $E = mc^2$ 表明质量和能量是等价的。

更复杂的例子: $\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$

## 块级公式示例

欧拉公式:

$$
e^{i\\pi} + 1 = 0
$$

高斯积分:

$$
\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}
$$

麦克斯韦方程组:

$$
\\begin{aligned}
\\nabla \\times \\vec{\\mathbf{B}} -\\, \\frac1c\\, \\frac{\\partial\\vec{\\mathbf{E}}}{\\partial t} & = \\frac{4\\pi}{c}\\vec{\\mathbf{j}} \\\\
\\nabla \\cdot \\vec{\\mathbf{E}} & = 4 \\pi \\rho \\\\
\\nabla \\times \\vec{\\mathbf{E}}\\, +\\, \\frac1c\\, \\frac{\\partial\\vec{\\mathbf{B}}}{\\partial t} & = \\vec{\\mathbf{0}} \\\\
\\nabla \\cdot \\vec{\\mathbf{B}} & = 0
\\end{aligned}
$$

二次方程求根公式:

$$
x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$
`);
    const [showPreview, setShowPreview] = useState(false);

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-foreground mb-2">LaTeX 公式功能测试</h1>
                    <p className="text-muted-foreground">
                        测试富文本编辑器中的 LaTeX 公式实时渲染功能
                    </p>
                </div>

                <div className="mb-4 flex gap-4">
                    <button
                        onClick={() => setShowPreview(false)}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                            !showPreview
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                    >
                        编辑模式
                    </button>
                    <button
                        onClick={() => setShowPreview(true)}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                            showPreview
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                    >
                        预览模式
                    </button>
                </div>

                {!showPreview ? (
                    <div className="bg-card border border-border rounded-lg overflow-hidden">
                        <RichTextEditor
                            content={content}
                            onChange={setContent}
                            variant="seamless"
                        />
                    </div>
                ) : (
                    <div className="bg-card border border-border rounded-lg p-8">
                        <MarkdownRenderer content={content} />
                    </div>
                )}

                <div className="mt-8 p-4 bg-muted rounded-lg">
                    <h2 className="text-lg font-semibold text-foreground mb-2">使用说明</h2>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm">
                        <li>点击工具栏中的 Σ 按钮插入行内公式</li>
                        <li>点击工具栏中较粗的 Σ 按钮插入块级公式</li>
                        <li>点击已有公式可以编辑它</li>
                        <li>行内公式: 按 Enter 保存,Esc 取消</li>
                        <li>块级公式: 按 Cmd/Ctrl+Enter 保存,Esc 取消</li>
                        <li>切换到预览模式查看最终渲染效果</li>
                    </ul>
                </div>

                <details className="mt-4">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        查看 Markdown 源码
                    </summary>
                    <pre className="mt-2 p-4 bg-muted rounded-lg overflow-x-auto text-sm">
                        <code>{content}</code>
                    </pre>
                </details>
            </div>
        </div>
    );
};

export default MathTest;
