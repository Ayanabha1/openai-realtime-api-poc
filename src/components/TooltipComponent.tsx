import React, { useState } from "react";

const TooltipComponent = ({
  children,
  text,
  visible,
}: {
  children: React.ReactNode;
  text: string;
  visible: boolean;
}) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        {children}
      </div>
      {visible && show && (
        <div className="absolute mt-2 right-0 transform -translate-y-1 bg-black text-white text-xs px-2 py-1 rounded w-[200px] z-10">
          {text}
        </div>
      )}
    </div>
  );
};

export default TooltipComponent;
