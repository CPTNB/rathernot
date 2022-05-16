use swc_plugin::ast::*;
use swc_plugin::utils::ident::IdentLike;
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use std::collections::HashMap;
use rn_coloring::*;

// the root node is those 9s to simplify the debug string replacement
const ROOT: u64 = 99999999999999;

#[derive(Clone, Copy, Eq, PartialEq)]
pub enum ClientServer {
  Client(),
  Server()
}

fn hash_ident (id: &Ident) -> u64 {
  let mut s = DefaultHasher::new();
  id.to_id().hash(&mut s);
  s.finish()
}

struct EdgeVisitor<'a> {
  from: &'a Ident,
  graph: &'a mut ColoringVisitor
}

impl <'a> EdgeVisitor<'a> {
  pub fn new (graph: &'a mut ColoringVisitor, from: &'a Ident) -> Self {
    Self { from, graph }
  }
}

impl Visit for EdgeVisitor<'_> {
  noop_visit_type!();
  fn visit_ident(&mut self, id: &Ident) {
    self.graph.add_edge(self.from, id);
  }
}


pub struct ColoringVisitor {
  coloring: Coloring<u64, ClientServer>,
  debug: bool,
  names: HashMap<u64, String>
}

impl ColoringVisitor {
  pub fn new (debug: bool) -> Self {
    let mut s = Self {
      coloring: Coloring::<u64, ClientServer>::new(ROOT),
      debug,
      names: HashMap::<u64, String>::new()
    };
    s.names.insert(ROOT, String::from("root"));
    return s;
  }

  fn add_root_edge(&mut self, to: &Ident) {
    let to_id = hash_ident(to);
    if self.debug {
      self.names.insert(to_id, to.sym.to_string());
    }
    self.coloring.add_edge(ROOT, to_id);
  }

  pub fn add_edge (&mut self, from: &Ident, to: &Ident) {
    let from_id = hash_ident(from);
    let to_id = hash_ident(to);
    if self.debug {
      self.names.insert(from_id, from.sym.to_string());
      self.names.insert(to_id, to.sym.to_string());
    }
    if from_id != to_id {
      self.coloring.add_edge(from_id,to_id);  
    }
  }

  pub fn get_dot_graph (&mut self, paint: &dyn Fn(ColorResult<ClientServer>) -> String) -> String {
    let mut dot_graph = self.coloring.get_dot_graph();
    if self.debug {
      for (key, val) in &self.names {
        let color = paint(self.coloring.get_color(key));
        let search_str = format!("label = \"{}\"", &key.to_string());
        let replace_str = format!("style=\"filled\" fillcolor=\"{}\"  label=\"{}\"", color, val);
        dot_graph = dot_graph.replace(&search_str, &replace_str);
      }
    }
    return dot_graph;
  }
}

impl Visit for ColoringVisitor {
  noop_visit_type!();

  fn visit_var_declarator(&mut self, decl: &VarDeclarator) {
    // todo: array decls
                                          // why do I need to clone this pat?
    if let Some(from_binding_id) = decl.name.clone().ident() {
      
      // if this is a service, then connect to root!
      if &*from_binding_id.id.sym == "foo" {
        self.add_root_edge(&from_binding_id.id);
        self.coloring.mark_node_as_dom(hash_ident(&from_binding_id.id), ClientServer::Client());
      }
      if &*from_binding_id.id.sym == "bar" {
        self.add_root_edge(&from_binding_id.id);
        self.coloring.mark_node_as_dom(hash_ident(&from_binding_id.id), ClientServer::Server());
      }
      let mut children_visitor = EdgeVisitor::new(self, &from_binding_id.id);
      decl.visit_children_with(&mut children_visitor);
    }
  }
}

#[cfg(test)]
mod coloring_visitor_tests {
  use swc_ecma_transforms_testing::{test, Tester};

  macro_rules! test_visit {
    ($test_name:ident, $syntax:expr, $input:expr, $body:expr) => {
      #[test]
      fn $test_name() {
        Tester::run(|tester| {
          let module = tester.parse_module("input.js", $input);
          match module {
            Err(err) => Err(err),
            Ok(module) => {
              $body(module)
            }
          }
        });
      }
    };
  }

  fn get_dot_graph (visitor: &mut ColoringVisitor) -> String {
    visitor.get_dot_graph(&|res| match res {
      ColorResult::Color(ClientServer::Client()) => "red".to_string(),
      ColorResult::Color(ClientServer::Server()) => "blue".to_string(),
      ColorResult::Multicolored() => "purple".to_string(),
      ColorResult::Uncolored() => "gray".to_string(),
      ColorResult::Unreachable() => "black".to_string(),
      ColorResult::ConflictingColors(_) => "orange".to_string(),
      ColorResult::DoesNotExist() => "pink".to_string()
    })
  }

  fn get_color_from_dot_graph<'a> (graph: &'a str, ident_name: &'a str) -> &'a str {
    let lines = graph.split("\n");
    for line in lines {
      if line.contains(ident_name) {
        let pre = line.split("fillcolor=\"").collect::<Vec<&str>>()[1];
        return pre.split("\"").collect::<Vec<&str>>()[0];
      }
    }
    return "😎 my hack is bulletproof and I will never encounter this branch 😎";
  }

  use super::*;

  test_visit!(
    graph_test,
    ::swc_ecma_parser::Syntax::default(),
    "const foo = baz; const bar = foo; const baz = 123",
    |module: Module| {
      let mut visitor = ColoringVisitor::new(true);
      module.visit_with(&mut visitor);
      let dot_graph = get_dot_graph(&mut visitor);
      println!("{}", dot_graph);
      match get_color_from_dot_graph(&dot_graph, "baz") {
        "red" => Ok(()),
        _ => Err(())
      }
    }
  );

  // With the current graph setup, the only node that can be uncolored is the root.
  // All nodes that don't have a color will instead be black (unreachable from root).
  // This is fine.
  test_visit!(
    test_uncolored_node,
    ::swc_ecma_parser::Syntax::default(),
    "const baz = foo; const foo = 123;  const bar = foo;",
    |module: Module| {
      let mut visitor = ColoringVisitor::new(true);
      module.visit_with(&mut visitor);
      let dot_graph = get_dot_graph(&mut visitor);
      println!("{}", dot_graph);
      let color = get_color_from_dot_graph(&dot_graph, "root");
      match color {
        "gray" => Ok(()),
        _ => {
          println!("wrong color for root: {}", color);
          Err(())
        }
      }
    }
  );
}
