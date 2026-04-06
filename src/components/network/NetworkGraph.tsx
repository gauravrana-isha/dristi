import { useEffect, useRef } from "react";
import Graph from "graphology";
import Sigma from "sigma";
import forceAtlas2 from "graphology-layout-forceatlas2";

interface Node {
  id: string;
  label: string;
  platform: string;
  postCount: number;
  category: "hate" | "misinfo" | "both";
  size: number;
}

interface Edge {
  id: string;
  source: string;
  target: string;
  weight: number;
  type: string;
}

interface Props {
  nodes: Node[];
  edges: Edge[];
}

const CATEGORY_COLORS: Record<string, string> = {
  hate: "#B7131A",
  misinfo: "#B77224",
  both: "#613AF5",
};

export default function NetworkGraph({ nodes, edges }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<Sigma | null>(null);

  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return;

    const graph = new Graph();

    nodes.forEach((n) => {
      graph.addNode(n.id, {
        label: n.label,
        size: n.size,
        color: CATEGORY_COLORS[n.category] ?? "#868686",
        x: Math.random() * 100,
        y: Math.random() * 100,
      });
    });

    edges.forEach((e) => {
      if (graph.hasNode(e.source) && graph.hasNode(e.target)) {
        try {
          graph.addEdge(e.source, e.target, {
            size: Math.max(1, e.weight),
            color: "#5E5E5E",
          });
        } catch {
          // skip duplicate edges
        }
      }
    });

    // Apply force-directed layout
    forceAtlas2.assign(graph, { iterations: 100, settings: { gravity: 1 } });

    // Clean up previous instance
    if (sigmaRef.current) {
      sigmaRef.current.kill();
    }

    sigmaRef.current = new Sigma(graph, containerRef.current, {
      renderLabels: true,
      labelSize: 10,
      labelColor: { color: "#C6C6C6" },
    });

    return () => {
      sigmaRef.current?.kill();
      sigmaRef.current = null;
    };
  }, [nodes, edges]);

  return (
    <div
      ref={containerRef}
      className="w-full h-[600px] bg-gray-900 rounded-lg"
      role="img"
      aria-label="Network graph showing account relationships"
    />
  );
}
