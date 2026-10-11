import * as Dialog from "@radix-ui/react-dialog";
import { Minus, Plus, X, ImageOff } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { Product } from "./types";
export function Drawer({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="drawer-overlay" />
        <Dialog.Content className="drawer-content">
          <div className="drawer-heading">
            <div>
              <Dialog.Title>{title}</Dialog.Title>
              <Dialog.Description>{description}</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Fechar">
                <X />
              </Button>
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export function QuantitySelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="quantity">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Diminuir quantidade"
        disabled={value <= 1}
        onClick={() => onChange(Math.max(1, value - 1))}
      >
        <Minus />
      </Button>
      <span aria-live="polite">{value}</span>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Aumentar quantidade"
        onClick={() => onChange(value + 1)}
      >
        <Plus />
      </Button>
    </div>
  );
}
export function ProductPhoto({
  product,
  className = "",
}: {
  product: Product;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const cover = product.images.find((image) => image.isCover) || product.images[0];
  return cover && !failed ? (
    <img
      className={className}
      src={cover.url}
      alt={cover.alt}
      width={384}
      height={384}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  ) : (
    <div className="photo-empty">
      <ImageOff />
      <span>Imagem indisponível</span>
    </div>
  );
}
