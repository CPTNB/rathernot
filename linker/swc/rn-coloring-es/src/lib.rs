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
  from: Ident,
  coloring_wrapper: &'a mut ColoringWrapper
}

impl <'a> EdgeVisitor<'a> {
  pub fn new (coloring_wrapper: &'a mut ColoringWrapper, from: Ident) -> Self {
    Self { from, coloring_wrapper }
  }
}

impl Visit for EdgeVisitor<'_> {
  noop_visit_type!();
  fn visit_ident(&mut self, id: &Ident) {
    self.coloring_wrapper.add_edge(&self.from, id);
  }
}

struct InvocationVisitor<'a> {
  coloring_wrapper: &'a mut ColoringWrapper
}

impl <'a> InvocationVisitor<'a> {
  pub fn new (coloring_wrapper: &'a mut ColoringWrapper) -> Self {
    Self { coloring_wrapper: coloring_wrapper }
  }
}

impl Visit for InvocationVisitor<'_> {
  noop_visit_type!();
  //look at each function invocation looking for Service(...)
  fn visit_call_expr(&mut self, expr: &CallExpr) {
    if let Callee::Expr(callee) = &expr.callee {
      if let Expr::Ident(name) = &**callee {
        println!("inside the invocation visitor");
        // self.coloring_wrapper.add_root_edge(id);
        // we might not want to mark this ident as a root edge and dominant
        // it may be enough to just edge visit all it's children
        if &*name.sym == "Service"  {
          expr.visit_children_with(&mut EdgeVisitor::new(self.coloring_wrapper, name.clone()))
        }
        // self.coloring_wrapper.coloring.mark_node_as_dom(hash_ident(id), color);
        // expr.visit_children_with(&mut self.coloring_wrapper.check_color_and_descend(&name))
        //expr.visit_children_with(&mut self.colorer.check_color_and_descend(&name))
      }
    }
  }
}

struct ColoringWrapper {
  coloring: Coloring<u64, ClientServer>,
  debug: bool,
  names: HashMap<u64, String>
}

impl ColoringWrapper {
  fn new (debug: bool) -> Self {
    let coloring = Coloring::<u64, ClientServer>::new(ROOT);
    let mut s = Self {
      coloring: coloring,
      debug,
      // invocation_visitor: InvocationVisitor::new(&mut coloring),
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


pub struct ColoringVisitor {
  coloring_wrapper: ColoringWrapper
}

impl ColoringVisitor {
  pub fn new (debug: bool) -> Self {
    Self { coloring_wrapper: ColoringWrapper::new(debug) }
    // let coloring = Coloring::<u64, ClientServer>::new(ROOT);
    // let mut s = Self {
    //   coloring: coloring,
    //   debug,
    //   // invocation_visitor: InvocationVisitor::new(&mut coloring),
    //   names: HashMap::<u64, String>::new()
    // };
    // s.names.insert(ROOT, String::from("root"));
    // return s;
  }

  

  fn is_coloring_ident (ident: &Ident) -> Option<ClientServer> {
    if &*ident.sym == "main" {
      return Some(ClientServer::Client());
    }
    if &*ident.sym == "Service" {
      return Some(ClientServer::Server());
    }
    None
  }

  fn check_color_and_descend (&mut self, id: &Ident) -> EdgeVisitor {
    match ColoringVisitor::is_coloring_ident(id) {
      Some(color) => {
        self.coloring_wrapper.add_root_edge(id);
        self.coloring_wrapper.coloring.mark_node_as_dom(hash_ident(id), color);
      },
      _ => ()
    }
    EdgeVisitor::new(&mut self.coloring_wrapper, id.clone())
  }
}

impl Visit for ColoringVisitor {
  noop_visit_type!();

  // visit declarations of new things:

  fn visit_var_declarator(&mut self, decl: &VarDeclarator) {
    // todo: array decls
                                   // why do I need to clone this pat?
    if let Some(from_binding_id) = decl.name.clone().ident() {
      let id = &from_binding_id.id;
      decl.visit_children_with(&mut self.check_color_and_descend(id));
      decl.visit_children_with(&mut InvocationVisitor::new(&mut self.coloring_wrapper));
    }
  }

  fn visit_import_named_specifier(&mut self, n: &ImportNamedSpecifier) {
    n.visit_children_with(&mut self.check_color_and_descend(&n.local));
    n.visit_children_with(&mut InvocationVisitor::new(&mut self.coloring_wrapper));
  }

  fn visit_assign_pat_prop(&mut self, n: &AssignPatProp) {
    n.visit_children_with(&mut self.check_color_and_descend(&n.key));
    n.visit_children_with(&mut InvocationVisitor::new(&mut self.coloring_wrapper));
  }

  fn visit_class_decl(&mut self, n: &ClassDecl) {
    n.visit_children_with(&mut self.check_color_and_descend(&n.ident));
    n.visit_children_with(&mut InvocationVisitor::new(&mut self.coloring_wrapper));
  }

  fn visit_class_expr(&mut self, n: &ClassExpr) {
    if let Some(name) = &n.ident {
      n.visit_children_with(&mut self.check_color_and_descend(&name));
    }
    n.visit_children_with(&mut InvocationVisitor::new(&mut self.coloring_wrapper));
  }

  fn visit_jsx_element_name(&mut self, n: &JSXElementName) {
    if let JSXElementName::Ident(name) = n {
      n.visit_children_with(&mut self.check_color_and_descend(&name));
    }
    n.visit_children_with(&mut InvocationVisitor::new(&mut self.coloring_wrapper));
  }

  fn visit_jsx_object(&mut self, n: &JSXObject) {
    if let JSXObject::Ident(name) = n {
      n.visit_children_with(&mut self.check_color_and_descend(&name));
    }
    n.visit_children_with(&mut InvocationVisitor::new(&mut self.coloring_wrapper));
  }

  fn visit_fn_decl(&mut self, n: &FnDecl) {
    n.visit_children_with(&mut self.check_color_and_descend(&n.ident));
    n.visit_children_with(&mut InvocationVisitor::new(&mut self.coloring_wrapper));
  }

  fn visit_fn_expr(&mut self, n: &FnExpr) {
    if let Some(name) = &n.ident {
      n.visit_children_with(&mut self.check_color_and_descend(&name));
    }
    n.visit_children_with(&mut InvocationVisitor::new(&mut self.coloring_wrapper));
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
    visitor.coloring_wrapper.get_dot_graph(&|res| match res {
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

//   test_visit!(
//     graph_test,
//     ::swc_ecma_parser::Syntax::default(),
//     r"
// import { Service } from 'rathernot';
// import { x } from 'x';

// const foo = Service(x);

// function main () { foo(); }

// ",
//     |module: Module| {
//       let mut visitor = ColoringVisitor::new(true);
//       module.visit_with(&mut visitor);
//       let dot_graph = get_dot_graph(&mut visitor);
//       println!("{}", dot_graph);
//       match get_color_from_dot_graph(&dot_graph, "x") {
//         "blue" => Ok(()),
//         _ => Err(())
//       }
//     }
//   );

  test_visit!(
    test_client_code,
    ::swc_ecma_parser::Syntax::default(),
    r"
import { Service } from 'rathernot';

const x = 2;
const foo = Service(x);

function main () { foo(); }

",
    |module: Module| {
      let mut visitor = ColoringVisitor::new(true);
      module.visit_with(&mut visitor);
      let dot_graph = get_dot_graph(&mut visitor);
      println!("{}", dot_graph);
      match get_color_from_dot_graph(&dot_graph, "foo") {
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
    r"const baz = foo; const foo = 123;  const bar = foo;",
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

  test_visit!(
    test_function_invocation,
    ::swc_ecma_parser::Syntax::default(),
    r"
import { Service } from 'rn';

const x = 1;
const foo = Service(x);
",
    |module: Module| {
      let mut visitor = ColoringVisitor::new(true);
      module.visit_with(&mut visitor);
      let dot_graph = get_dot_graph(&mut visitor);
      println!("{}", dot_graph);
      let color = get_color_from_dot_graph(&dot_graph, "x");
      match color {
        "blue" => Ok(()),
        _ => Err(())
      }
    }
  );

  // half-baked
  // test_visit!(
  //   test_conflicting_colors,
  //   ::swc_ecma_parser::Syntax::default(),
  //   "const foo = bar; const bar = baz;  const baz = 'baz';",
  //   |module: Module| {
  //     let mut visitor = ColoringVisitor::new(true);
  //     module.visit_with(&mut visitor);
  //     let dot_graph = get_dot_graph(&mut visitor);
  //     println!("{}", dot_graph);
  //     let color = get_color_from_dot_graph(&dot_graph, "baz");
  //     match color {
  //       "blue" => Ok(()),
  //       _ => {
  //         println!("wrong color for baz: {}", color);
  //         Err(())
  //       }
  //     }
  //   }
  // );
}
