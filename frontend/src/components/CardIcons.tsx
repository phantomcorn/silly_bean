import type { ReactNode } from "react";
import { BEAN_POINTS } from "./Bean";

// Flat geometric icons for the action cards, drawn on an 84×56 canvas.

// `left` is where the artwork starts, so the drawing sits flush with the card's text.
function Icon({ left, children }: { left: number; children: ReactNode }) {
  return (
    <svg className="card-icon" viewBox={`${left} 0 84 56`} aria-hidden="true">
      {children}
    </svg>
  );
}

function MiniBean({
  x,
  y,
  scale,
  fill,
  rotate = 0,
}: {
  x: number;
  y: number;
  scale: number;
  fill: string;
  rotate?: number;
}) {
  return (
    <polygon
      points={BEAN_POINTS}
      fill={fill}
      transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}
    />
  );
}

export function ClaimIcon() {
  return (
    <Icon left={20}>
      <polygon points="30,14 54,14 50,20 62,30 64,46 58,52 26,52 20,46 22,30 34,20" fill="var(--ochre)" />
      <polygon points="31,17 53,17 51,22 33,22" fill="var(--tomato)" />
      <MiniBean x={36} y={10} scale={0.13} rotate={-20} fill="var(--moss)" />
      <MiniBean x={49} y={9} scale={0.13} rotate={15} fill="var(--rose)" />
    </Icon>
  );
}

export function TransferIcon() {
  return (
    <Icon left={9}>
      <polygon points="10,30 74,10 46,48" fill="var(--indigo)" />
      <polygon points="74,10 34,33 38,48" fill="var(--rose)" />
      <MiniBean x={16} y={46} scale={0.1} fill="var(--ochre)" />
    </Icon>
  );
}

export function BurnIcon() {
  return (
    <Icon left={24}>
      <polygon points="42,4 54,20 60,32 58,44 50,52 34,52 26,44 24,32 32,22 36,30 38,18" fill="var(--tomato)" />
      <polygon points="42,24 50,36 48,46 42,50 36,46 34,38 38,32 40,36" fill="var(--ochre)" />
    </Icon>
  );
}

export function PlantIcon() {
  return (
    <Icon left={10}>
      <rect x={40} y={18} width={4} height={22} fill="var(--moss)" />
      <polygon points="42,28 30,18 20,22 30,30" fill="var(--moss)" />
      <polygon points="42,24 52,10 64,12 56,24" fill="var(--moss)" />
      <polygon points="10,52 22,40 42,36 62,40 74,52" fill="var(--tomato)" />
      <MiniBean x={42} y={46} scale={0.1} fill="var(--ochre)" />
    </Icon>
  );
}

export function HarvestIcon() {
  return (
    <Icon left={12}>
      <MiniBean x={30} y={22} scale={0.16} fill="var(--moss)" />
      <MiniBean x={54} y={22} scale={0.16} rotate={-15} fill="var(--indigo)" />
      <MiniBean x={42} y={17} scale={0.16} rotate={20} fill="var(--rose)" />
      <polygon points="16,30 68,30 62,52 22,52" fill="var(--ochre)" />
      <polygon points="12,26 72,26 72,32 12,32" fill="var(--tomato)" />
    </Icon>
  );
}

export function UprootIcon() {
  return (
    <Icon left={20}>
      <rect x={40} y={14} width={4} height={22} fill="var(--moss)" />
      <polygon points="42,24 30,14 20,18 30,26" fill="var(--moss)" />
      <polygon points="42,20 52,6 64,8 56,20" fill="var(--moss)" />
      <g stroke="var(--indigo)" strokeWidth={3} strokeLinecap="round">
        <line x1={42} y1={34} x2={34} y2={48} />
        <line x1={42} y1={34} x2={42} y2={52} />
        <line x1={42} y1={34} x2={50} y2={46} />
      </g>
      <polygon points="70,8 78,18 73,18 73,32 67,32 67,18 62,18" fill="var(--ochre)" />
    </Icon>
  );
}

const LEAF_POINTS = "0,0 7,-7 18,-7 15,1 6,4";

// Small beanstalk growing from a soil mound, shared by the stake/unstake icons.
function Beanstalk() {
  return (
    <>
      <polygon points="4,56 14,48 24,46 34,48 44,56" fill="var(--tomato)" />
      <path
        d="M24 48 C 16 38, 32 30, 24 20 S 18 8, 26 4"
        fill="none"
        stroke="var(--moss)"
        strokeWidth={5}
        strokeLinecap="round"
      />
      <polygon points={LEAF_POINTS} fill="var(--moss)" transform="translate(21 38) scale(-1 1)" />
      <polygon points={LEAF_POINTS} fill="var(--moss)" transform="translate(27 28)" />
      <polygon points={LEAF_POINTS} fill="var(--moss)" transform="translate(22 14) scale(-0.8 0.8)" />
    </>
  );
}

export function FarmIcon() {
  return (
    <Icon left={4}>
      <polygon points="8,30 40,30 40,56 8,56" fill="var(--tomato)" />
      <polygon points="4,32 10,16 24,6 38,16 44,32" fill="var(--indigo)" />
      <polygon points="21,17 27,17 27,24 21,24" fill="var(--paper)" />
      <polygon points="17,38 31,38 31,56 17,56" fill="var(--ochre)" />
      <path d="M17 38 L31 56 M31 38 L17 56" stroke="var(--tomato)" strokeWidth={2} />
    </Icon>
  );
}

export function BeanstalkIcon() {
  return (
    <Icon left={4}>
      <Beanstalk />
    </Icon>
  );
}

export function StakeIcon() {
  return (
    <Icon left={4}>
      <Beanstalk />
      <polygon points="62,26 52,26 52,21 44,29 52,37 52,32 62,32" fill="var(--tomato)" />
      <MiniBean x={71} y={29} scale={0.12} fill="var(--ochre)" />
    </Icon>
  );
}

export function UnstakeIcon() {
  return (
    <Icon left={4}>
      <Beanstalk />
      <polygon points="42,26 54,26 54,21 62,29 54,37 54,32 42,32" fill="var(--tomato)" />
      <MiniBean x={71} y={29} scale={0.12} fill="var(--ochre)" />
    </Icon>
  );
}

export function PredictIcon() {
  return (
    <Icon left={18}>
      <polygon points="18,30 30,10 42,30 35,30 35,50 25,50 25,30" fill="var(--moss)" />
      <polygon points="42,26 49,26 49,6 59,6 59,26 66,26 54,46" fill="var(--tomato)" />
    </Icon>
  );
}
