"use client"

export default function InteractiveBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {/* 主背景渐变 - 保留原来的紫色渐变 */}
      <div
        className="absolute inset-0 transition-all duration-500"
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      />

      {/* 动态网格图案 */}
      <div
        className="absolute inset-0 grid-pattern"
        style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.1) 2px, transparent 2px),
            radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px, 40px 40px",
          animation: "gridMove 20s linear infinite",
        }}
      />

      {/* 浮动元素 */}
      <div className="absolute inset-0 floating-elements">
        {/* 浮动元素 1 */}
        <div
          className="absolute rounded-full floating-element-1"
          style={{
            width: "120px",
            height: "120px",
            top: "10%",
            left: "5%",
            background: "rgba(255, 107, 107, 0.15)",
            animation: "float 8s ease-in-out infinite",
            animationDelay: "0s",
          }}
        />

        {/* 浮动元素 2 */}
        <div
          className="absolute rounded-full floating-element-2"
          style={{
            width: "80px",
            height: "80px",
            top: "70%",
            right: "10%",
            background: "rgba(78, 205, 196, 0.15)",
            animation: "float 8s ease-in-out infinite",
            animationDelay: "2s",
          }}
        />

        {/* 浮动元素 3 */}
        <div
          className="absolute rounded-full floating-element-3"
          style={{
            width: "100px",
            height: "100px",
            bottom: "20%",
            left: "70%",
            background: "rgba(69, 183, 209, 0.15)",
            animation: "float 8s ease-in-out infinite",
            animationDelay: "4s",
          }}
        />

        {/* 额外的浮动元素 - 增加视觉层次 */}
        <div
          className="absolute rounded-full floating-element-4"
          style={{
            width: "60px",
            height: "60px",
            top: "30%",
            right: "25%",
            background: "rgba(255, 193, 7, 0.12)",
            animation: "float 8s ease-in-out infinite",
            animationDelay: "1s",
          }}
        />

        <div
          className="absolute rounded-full floating-element-5"
          style={{
            width: "90px",
            height: "90px",
            bottom: "40%",
            left: "15%",
            background: "rgba(156, 39, 176, 0.12)",
            animation: "float 8s ease-in-out infinite",
            animationDelay: "3s",
          }}
        />

        <div
          className="absolute rounded-full floating-element-6"
          style={{
            width: "70px",
            height: "70px",
            top: "50%",
            left: "50%",
            background: "rgba(76, 175, 80, 0.12)",
            animation: "float 8s ease-in-out infinite",
            animationDelay: "5s",
          }}
        />
      </div>
    </div>
  )
}
