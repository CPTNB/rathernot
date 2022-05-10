use petgraph::graph::{DiGraph, NodeIndex};
use petgraph::algo::dominators::{Dominators, simple_fast};
use petgraph::Direction::Incoming;
// use petgraph::algo::{dijkstra, min_spanning_tree};
// use petgraph::data::FromElements;
// use petgraph::dot::{Dot, Config};
use std::collections::HashMap;
// use std::collections::HashSet;
use std::hash::Hash;


// fn foobar () {
//   // Create an undirected graph with `i32` nodes and edges with `()` associated data.
//   let g = UnGraph::<i32, ()>::from_edges(&[
//       (1, 2), (2, 3), (3, 4),
//       (1, 4)]);

//   // Find the shortest path from `1` to `4` using `1` as the cost for every edge.
//   let node_map = dijkstra(&g, 1.into(), Some(4.into()), |_| 1);
//   assert_eq!(&1i32, node_map.get(&NodeIndex::new(4)).unwrap());

//   // Get the minimum spanning tree of the graph as a new graph, and check that
//   // one edge was trimmed.
//   let mst = UnGraph::<_, _>::from_elements(min_spanning_tree(&g));
//   assert_eq!(g.raw_edges().len() - 1, mst.raw_edges().len());

//   // Output the tree to `graphviz` `DOT` format
//   println!("{:?}", Dot::with_config(&mst, &[Config::EdgeNoLabel]));
//   // graph {
//   //     0 [label="\"0\""]
//   //     1 [label="\"0\""]
//   //     2 [label="\"0\""]
//   //     3 [label="\"0\""]
//   //     1 -- 2
//   //     3 -- 4
//   //     2 -- 3
//   // }  
// }

pub struct Coloring<NodeType: Copy + Eq + Hash, Colors> {
  node_indices: HashMap<NodeType, NodeIndex>,
  dom_nodes: HashMap<NodeIndex, Colors>,
  graph: DiGraph::<NodeType, ()>,
  root: Option<NodeIndex>,
  doms: Option<Dominators<NodeIndex>>
}

pub enum ColorResult<Colors> {
  // all paths to the node are colored the same
  Color(Colors),

  // dominators of different colors found
  ConflictingColors(Vec<Colors>),

  // no dominators, and no colored paths
  Uncolored(),

  // no dominators, with more than one colored path
  Multicolored(),

  // node does not exist in graph
  DoesNotExist(),

  // node is unreachable from the root
  Unreachable()
}

impl <NodeType: Copy + Eq + Hash, Colors: Eq> Coloring<NodeType, Colors> {
  pub fn new (root: NodeType) -> Self {
    let s = Self {
      dom_nodes: HashMap::new(),
      node_indices: HashMap::new(),
      graph: DiGraph::new(),
      doms: None,
      root: None
    };
    s.add(root);
    return s;
  }

  fn add (&self, n: NodeType) -> NodeIndex {
    match self.node_indices.get(&n) {
      None => {
        let idx = self.graph.add_node(n);
        self.node_indices.insert(n, idx);
        idx
      },
      Some(idx) => *idx
    }
  }

  pub fn mark_node_as_dom (&self, n: NodeType, color: Colors) {
    self.dom_nodes.insert(self.add(n), color);
  }

  pub fn add_edge (&self, from: NodeType, to: NodeType) {
    self.graph.add_edge(self.add(from), self.add(to), ());
  }

  pub fn get_color (&self, n: &NodeType) -> ColorResult<Colors> {
    //todo
    let doms = match self.doms {
      None => { simple_fast(&self.graph, self.root.unwrap()) },
      Some(d) => d
    };

    let idx = match self.node_indices.get(n) {
      None => return ColorResult::DoesNotExist(),
      Some(idx) => idx
    };

    let colors = Vec::<Colors>::new();
    match doms.dominators(*idx) {
      None => return ColorResult::Unreachable(),
      Some(dom_nodes) => {
        for dom in dom_nodes {
          match self.dom_nodes.get(&dom) {
            Some(color) => {
              let non_unique = false;
              for c in colors.iter() {
                if c.eq(color) {
                  non_unique = true;
                  break;
                }
              }
              if !non_unique {
                colors.push(*color);  
              }
            },
            _ => ()
          };
        }
      }
    };
    if colors.len() == 1 {
      return ColorResult::Color(colors[0]);
    }
    if colors.len() > 1 {
      return ColorResult::ConflictingColors(colors);
    }

    // no dominating colors ?
    // either multicolored or no color
    // dfs up from the node to look for dominating indices
    // if one is found, its multicolored; otherwise uncolored
    let stack = vec!(idx);
    let mut focus;
    let mut incoming;
    loop {
      focus = stack.pop().unwrap();
      match self.dom_nodes.get(focus) {
        Some(_) => return ColorResult::Multicolored(),
        _ => ()
      };
      incoming = self.graph.neighbors_directed(*focus, Incoming);
      for n in incoming {
        stack.push(&n);
      }
      if stack.len() == 0 {
        return ColorResult::Uncolored();
      }
    }
  }
}

#[cfg(test)]
mod coloring_tests {
  use super::*;

  enum RB {
    Red(),
    Blue()
  }

  #[test]
  fn test_one () {

    let coloring = Coloring::<i32, RB>::new(1);
    let a = 1;
    let b = 2;

    assert_eq!(a, b);
  }
}

/*

Build the graph on the initial, non mutation visitation
"seal" the graph at some point; probably the first time somebody looks at a color
  or make Dominators "sealed" over a state -- whenever nodes or edges are added it marks
  // the dominators as stale


// idempotent
// either creates the node or uses the existing one, but sets its color
mark_node_as_dom (&dom_node, color)

// creates the nodes with NOT_DOMINANT if no node exists
// uses the existing node
add_edge(&dom_node, &dom_node)
get_color(&dom_node) Result<Color>
    // node doesn't exist
    // node has multiple colors


enum ColorResult {
  color(Enum_Colors), // server or client
  

  uncolored, // warn n' drop
  

  multicolored, //include in both bundles
  

  Node doesn't exist //error in traversal
  

  // user error
  // function main (foobar) { Service(xyz) }
  // we might only see this on the service call itself
  conflicting_dominators(vec<Enum_Colors>) 

}

color_doms = hashmap<dom_node_hash, color>

idempotent_add(&dom_node) {
  if !exists(&dom_node) {
    add_node(&dom_node)
  }
}

mark_node_as_dom (&dom_node, color) {
  self.idempotent_add(&dom_node)
  color_doms.put(&dom_node, color)
}

get_color(&dom_node) {
  if !exists(&dn) {
    return not_found()
  }
  colors = vec<Colors>
  dominators = self.graph.get_dominators(&dn)
  for (dom in dominaotrs.iter()) {
    match self.color_doms.get(dom) {
      Some(color) => colors.add(color)
      None => ()
    }
  }
  if colors.length == 1 {
    return Color(colors.first())
  }
  if colors.length > 1 {
    return conflicting_dominators(colors)
  }
  // no colors ?
  dfs up looking for color_doms
  if color doms {
    return multicolored()
  }
  return uncolored()
}

*/


//


