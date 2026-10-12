import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Menu, MessageCircle, ShoppingBag, Layers3, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/brand-logo.webp";
import { useCart } from "../cart/CartProvider";
import { Drawer } from "./controls";
import { companyConfig, whatsappUrl } from "./config";
export function Header() {
  const cart = useCart();
  const [menu, setMenu] = useState(false);
  const navigation = (
    <>
      <Link
        to="/catalogo"
        activeProps={{ className: "nav-active" }}
        activeOptions={{ exact: true }}
        onClick={() => setMenu(false)}
      >
        Catálogo
      </Link>
      <Link
        to="/categorias"
        activeProps={{ className: "nav-active" }}
        onClick={() => setMenu(false)}
      >
        Categorias
      </Link>
      <Link to="/sobre" activeProps={{ className: "nav-active" }} onClick={() => setMenu(false)}>
        Sobre nós
      </Link>
      <Link to="/contato" activeProps={{ className: "nav-active" }} onClick={() => setMenu(false)}>
        Contato <ArrowUpRight size={13} />
      </Link>
    </>
  );
  return (
    <>
      <div className="announcement">
        <span>CRIATIVIDADE + TECNOLOGIA</span>
        <i />
        <span>Peças únicas. Possibilidades infinitas.</span>
      </div>
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/catalogo" className="brand" aria-label="Criar3D.01 — Catálogo">
            <img src={logo} width={68} height={68} alt="Logo Criar3D.01" />
            <span><small>UMA MARCA RF TECNOLOGIA</small></span>
          </Link>
          <nav className="desktop-nav">{navigation}</nav>
          <div className="header-actions">
            <Button
              variant="outline"
              className="cart-button"
              aria-label={`Abrir carrinho, ${cart.count} itens`}
              onClick={() => cart.setOpen(true)}
            >
              <ShoppingBag />
              <span>Carrinho</span>
              <b>{cart.count}</b>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="menu-button"
              aria-label="Abrir menu"
              onClick={() => setMenu(true)}
            >
              <Menu />
            </Button>
          </div>
        </div>
      </header>
      <Drawer
        open={menu}
        onOpenChange={setMenu}
        title="Criar3D.01"
        description="Uma marca RF Tecnologia"
      >
        <nav className="mobile-nav">{navigation}</nav>
      </Drawer>
    </>
  );
}
export function Footer() {
  const url = whatsappUrl();
  return (
    <>
      <footer className="site-footer">
        <div className="container footer-main">
          <div>
            <Link className="footer-brand" to="/catalogo">
              <Layers3 size={26} /> criar3D.01
            </Link>
            <p>
              Tecnologia para criar.
              <br />
              Cuidado para transformar.
            </p>
            <span>UMA MARCA RF TECNOLOGIA</span>
          </div>
          <div>
            <h4>Explore</h4>
            <Link to="/catalogo">Catálogo</Link>
            <Link to="/categorias">Categorias</Link>
            <Link to="/admin">Área administrativa</Link>
          </div>
          <div>
            <h4>Vamos conversar</h4>
            <Link to="/sobre">Sobre nós</Link>
            <Link to="/contato">
              Contato <ArrowUpRight size={12} />
            </Link>
            <a href={companyConfig.mapsUrl} target="_blank" rel="noreferrer">
              <MapPin size={13} /> Ver endereço
            </a>
          </div>
          <div className="footer-detail">
            <span>FEITO CAMADA POR CAMADA.</span>
            <p>
              Do primeiro esboço
              <br />
              ao seu próximo favorito.
            </p>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© 2026 Criar3D.01 + RF Tecnologia</span>
          <span>Impressão 3D e produtos personalizados</span>
        </div>
      </footer>
      {url ? (
        <Button variant="whatsapp" size="icon" asChild>
          <a
            className="floating-whatsapp"
            href={url}
            target="_blank"
            rel="noreferrer"
            aria-label="Falar no WhatsApp"
          >
            <MessageCircle />
          </a>
        </Button>
      ) : (
        <Button variant="whatsapp" size="icon" className="floating-whatsapp" asChild>
          <Link to="/contato" aria-label="Contato pelo WhatsApp">
            <MessageCircle />
          </Link>
        </Button>
      )}
    </>
  );
}
