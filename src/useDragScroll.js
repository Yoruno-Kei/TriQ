//useDragScroll.js
import { useRef } from "react";

export function useDragScroll() {
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const scrollLeftStart = useRef(0);

  const onMouseDown = (e, ref) => {
    if (!ref.current) return;
    isDragging.current = true;
    dragStartX.current = e.pageX;
    scrollLeftStart.current = ref.current.scrollLeft;
  };

  const onMouseUp = () => {
    isDragging.current = false;
  };

  const onMouseMove = (e, ref) => {
    if (!isDragging.current || !ref.current) return;
    e.preventDefault();
    const dx = e.pageX - dragStartX.current;
    ref.current.scrollLeft = scrollLeftStart.current - dx;
  };

  return { onMouseDown, onMouseUp, onMouseMove };
}
