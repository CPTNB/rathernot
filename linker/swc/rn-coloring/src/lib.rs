use petgraph::graph::{DiGraph, NodeIndex};
use petgraph::algo::dominators::{Dominators, simple_fast};
use petgraph::Direction::Incoming;
use petgraph::dot::{Dot, Config};
use std::collections::HashMap;
use std::hash::Hash;

pub struct Coloring<NodeType: Copy + Eq + Hash, Colors: Copy + Eq> {
  node_indices: HashMap<NodeType, NodeIndex>,
  dom_nodes: HashMap<NodeIndex, Colors>,
  pub graph: DiGraph::<NodeType, ()>,
  root: Option<NodeIndex>,
  doms: Option<Dominators<NodeIndex>>
}

#[derive(PartialEq)]
pub enum ColorResult<Colors> {
  // all paths to the node are colored the same
  Color(Colors),

  // no dominators, and no colored paths
  Uncolored(),

  // no dominators, with more than one colored path
  Multicolored(),

  // dominators of different colors found
  ConflictingColors(Vec<Colors>),

  // node does not exist in graph
  DoesNotExist(),

  // node is unreachable from the root
  Unreachable()
}

impl <NodeType: Copy + Eq + Hash + std::fmt::Debug, Colors: Copy + Eq> Coloring<NodeType, Colors> {
  pub fn new (root: NodeType) -> Self {
    let mut s = Self {
      dom_nodes: HashMap::new(),
      node_indices: HashMap::new(),
      graph: DiGraph::new(),
      doms: None,
      root: None
    };
    s.root = Some(s.add(root));
    return s;
  }

  fn add (&mut self, n: NodeType) -> NodeIndex {
    match self.node_indices.get(&n) {
      None => {
        let idx = self.graph.add_node(n);
        self.node_indices.insert(n, idx);
        idx
      },
      Some(idx) => *idx
    }
  }

  pub fn mark_node_as_dom (&mut self, n: NodeType, color: Colors) {
    let local = self.add(n);
    self.dom_nodes.insert(local, color);
  }

  pub fn add_edge (&mut self, from: NodeType, to: NodeType) {
    let local1 = self.add(from);
    let local2 = self.add(to);
    self.graph.add_edge(local1, local2, ());
  }

  fn add_dominating_color (&self, idx: &NodeIndex, colors: &mut Vec<Colors>) {
    match self.dom_nodes.get(idx) {
      Some(color) => {
        for c in colors.iter() {
          if c.eq(color) {
            return;
          }
        }
        colors.push(*color);
      },
      _ => ()
    };
  }

  pub fn get_color (&mut self, n: &NodeType) -> ColorResult<Colors> {
    match &self.doms {
      None => { self.doms = Some(simple_fast(&self.graph, self.root.unwrap())) },
      _ => ()
    };
    let doms = &self.doms.as_ref().unwrap();

    let idx = match self.node_indices.get(n) {
      None => return ColorResult::DoesNotExist(),
      Some(idx) => idx
    };

    let mut colors = Vec::<Colors>::new();
    match doms.dominators(*idx) {
      None => return ColorResult::Unreachable(),
      Some(dom_nodes) => {
        for dom in dom_nodes {
          self.add_dominating_color(&dom, &mut colors);
        }
      }
    };
    if colors.len() > 1 {
      return ColorResult::ConflictingColors(colors);
    }
    if colors.len() == 1 {
      return ColorResult::Color(colors[0]);
    }

    // no dominating colors ?
    // get the anecstors to determine color
    // if all ancestors are uncolored -> uncolored
    // if all colored ancestors are the same color -> that color
    // if there are multiple colors in ancestors -> multicolored
    let mut stack = vec!(*idx);
    let mut focus;
    let mut incoming;
    loop {
      focus = stack.pop().unwrap();
      self.add_dominating_color(&focus, &mut colors);
      incoming = self.graph.neighbors_directed(focus, Incoming);
      for n in incoming {
        stack.push(n);
      }
      if stack.len() == 0 {
        break;
      }
    }

    if colors.len() > 1 {
      return ColorResult::Multicolored();
    }
    if colors.len() == 1 {
      return ColorResult::Color(colors[0]);
    }
    return ColorResult::Uncolored();
  }

  pub fn get_dot_graph (&self) -> String {
    return format!("{:?}", Dot::with_config(&self.graph, &[Config::EdgeNoLabel]));
  }
}

#[cfg(test)]
mod coloring_tests {
  use super::*;

  #[derive(Clone, Copy, Eq, PartialEq)]
  enum RB {
    Red(),
    Blue()
  }

  #[test]
  fn test_uncolored_nodes () {
    let mut coloring = Coloring::<i32, RB>::new(1);
    coloring.add_edge(1, 2);
    coloring.add_edge(1, 3);
    coloring.add_edge(2, 3);

    match coloring.get_color(&2) {
      ColorResult::<RB>::Uncolored() => assert_eq!(true, true),
      _ => assert_eq!(true, false)
    }
  }

  #[test]
  fn test_red_nodes () {
    let mut coloring = Coloring::<i32, RB>::new(1);
    coloring.add_edge(1, 2);
    coloring.add_edge(1, 3);
    coloring.add_edge(2, 3);
    coloring.mark_node_as_dom(1, RB::Red());

    match coloring.get_color(&2) {
      ColorResult::<RB>::Color(RB::Red()) => assert_eq!(true, true),
      _ => assert_eq!(true, false)
    }
  }

  #[test]
  fn test_multicolored_nodes () {
    let mut coloring = Coloring::<i32, RB>::new(1);
    coloring.add_edge(1, 2);
    coloring.add_edge(1, 3);
    coloring.add_edge(2, 4);
    coloring.add_edge(3, 4);
    coloring.mark_node_as_dom(2, RB::Red());
    coloring.mark_node_as_dom(3, RB::Blue());

    match coloring.get_color(&4) {
      ColorResult::<RB>::Multicolored() => assert_eq!(true, true),
      _ => assert_eq!(true, false)
    }
  }

  #[test]
  fn test_conflicting_colors () {
    let mut coloring = Coloring::<i32, RB>::new(1);
    coloring.add_edge(1, 2);
    coloring.add_edge(1, 3);
    coloring.add_edge(2, 4);
    coloring.mark_node_as_dom(1, RB::Red());
    coloring.mark_node_as_dom(2, RB::Blue());

    match coloring.get_color(&4) {
      ColorResult::<RB>::ConflictingColors(_) => assert_eq!(true, true),
      _ => assert_eq!(true, false)
    }
  }

  #[test]
  fn test_two_paths_same_color () {
    let mut coloring = Coloring::<i32, RB>::new(1);
    coloring.add_edge(1, 2);
    coloring.add_edge(1, 3);
    coloring.add_edge(2, 4);
    coloring.add_edge(3, 4);
    coloring.mark_node_as_dom(2, RB::Red());
    coloring.mark_node_as_dom(3, RB::Red());

    match coloring.get_color(&4) {
      ColorResult::<RB>::Color(RB::Red()) => assert_eq!(true, true),
      _ => assert_eq!(true, false)
    }
  }
}
