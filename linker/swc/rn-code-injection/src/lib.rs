use anyhow::Context;
use serde::{Deserialize, Serialize};
use swc_plugin::{ast::*, plugin_transform, TransformPluginProgramMetadata};
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
// use rn_coloring::ColorResult;
// use rn_coloring_es::*;

mod macros;
mod constructs;

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[serde(deny_unknown_fields)]
pub struct Config {
  // hack for unit tests
  #[serde(default)]
  provided_slug: u64,

  #[serde(default)]
  is_client: bool,

  #[serde(default)]
  pub filename: Option<String>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PluginContext {
  #[serde(default)]
  pub filename: Option<String>,
}

#[derive(Hash)]
struct ExprsWithFilename<'a> {
  expr:  Option<&'a Expr>,
  call_expr:  Option<&'a CallExpr>,
  filename: String
}

impl Default for Config {
  fn default() -> Self {
    serde_json::from_str("{}").unwrap()
  }
}

struct TransformVisitor {
  config: Config
}

impl TransformVisitor {
  pub fn new(config: Config) -> Self {
    Self { config }
  }

  fn calculate_hash<T: Hash>(&self, t: T) -> u64 {
    // hack for unit tests
    if self.config.provided_slug > 0 {
      return self.config.provided_slug;
    }
    let mut s = DefaultHasher::new();
    t.hash(&mut s);
    s.finish()
  }

  fn replace_service_call (&self, service_expr: &CallExpr) -> Expr {
    let service_id_literal = constructs::id_literal(self.calculate_hash(service_expr));
    if self.config.is_client {
      return constructs::rnos_client_call(service_id_literal)
    } else {
      return constructs::rnos_server_call(service_id_literal, service_expr)
    }
  }

  fn replace_main_stmt (&self, expr: Box<Expr>) -> Decl {
    if !self.config.is_client {
      return constructs::void_decl();
    }
    let id = self.calculate_hash(&*expr);
    return constructs::main_declaration(expr, id)
  }
}

impl VisitMut for TransformVisitor {
  noop_visit_mut_type!();

  fn visit_mut_expr(&mut self, expr: &mut Expr) {
    expr.visit_mut_children_with(self);
    if_let_chain! {[
      let Expr::Call(call_expr) = &expr,
      let Callee::Expr(callee) = &call_expr.callee,
      let Expr::Ident(id) = &**callee
    ], {
      if &*id.sym == "Service" {
        *expr = self.replace_service_call(&call_expr)
      }
    }};
  }

  // looks for:
  // function main (root) { }
  // produces:
  // let main  = _RNOS_MAIN('slug', function main (root) { })
  fn visit_mut_decl(&mut self, decl: &mut Decl) {
    decl.visit_mut_children_with(self);
    let mut main_stmt = None;
    match decl {
      // function main (root) { }
      Decl::Fn(fn_decl) => {
        if &*fn_decl.ident.sym == "main" {
          main_stmt = Some(self.replace_main_stmt(Box::new(Expr::Fn(FnExpr {
            ident: None,
            function: fn_decl.function.clone()
          }))));
        }
      },
      // var main = (root) => 
      Decl::Var(var_decl) => {
        for var in var_decl.decls.iter() {
          match &var.name {
            Pat::Ident(id_pat) => {
              if &*id_pat.id.sym == "main" {
                if let Some(init) = &var.init {
                  match &**init {
                    Expr::Fn(..) |
                    Expr::Arrow(..) =>
                      main_stmt = Some(self.replace_main_stmt(Box::new(*init.clone()))),
                    _ => ()
                  }
                }
              }
            },
            // destructuring assignments
            // these are hard because we can't resolve the expression on RHS
            // const [ main ] = [ (root) => ... ]
            Pat::Array(..) |
            // const { main } = { main: (root) => ... }
            Pat::Object(..) => (),
            _ => ()
          }
        }
      },
      _ => ()
    }
    if let Some(v) = main_stmt {
      *decl = v;
    }
  }
}

/// An entrypoint to the SWC's transform plugin.
/// `plugin_transform` macro handles necessary interop to communicate with the host,
/// and entrypoint function name (`process_transform`) can be anything else.
///
/// If plugin need to handle low-level ptr directly,
/// it is possible to opt out from macro by writing transform fn manually via raw interface
///
/// `__plugin_process_impl(
///     ast_ptr: *const u8,
///     ast_ptr_len: i32,
///     config_str_ptr: *const u8,
///     config_str_ptr_len: i32) ->
///     i32 /*  0 for success, fail otherwise.
///             Note this is only for internal pointer interop result,
///             not actual transform result */
///
/// However, this means plugin author need to handle all of serialization/deserialization
/// steps with communicating with host. Refer `swc_plugin_macro` for more details.
#[plugin_transform]
pub fn process_transform(program: Program, _metadata: TransformPluginProgramMetadata) -> Program {
  let mut config: Config = serde_json::from_str(&_metadata.plugin_config)
    .context("failed to parse plugin config")
    .unwrap();

  let context: PluginContext = serde_json::from_str(&_metadata.transform_context)
    .context("failed to parse plugin context")
    .unwrap();

  config.filename = context.filename;

  // todo
  // let mut graph_builder = ColoringVisitor::new();
  // // builds the graph
  // program.visit_with(&mut visitor);

  // deletes/modifies code
  program.fold_with(&mut as_folder(TransformVisitor::new(config)))
}

#[cfg(test)]
mod transform_visitor_tests {
    use swc_ecma_transforms_testing::{test};

    use super::*;

    fn transform_visitor(config: Config) -> impl 'static + Fold + VisitMut {
        as_folder(TransformVisitor::new(config))
    }

    test!(
        ::swc_ecma_parser::Syntax::default(),
        |_| transform_visitor(Config {
            filename: Some("input.js".to_owned()),
            is_client: false,
            provided_slug: 123,
            ..Default::default()
        }),
        should_replace_service_call_with_slug,
        r#"Service({});"#,
        r#"Service._RNOS_SERVER(123, {});"#
    );

    test!(
        ::swc_ecma_parser::Syntax::default(),
        |_| transform_visitor(Config {
            filename: Some("input.js".to_owned()),
            is_client: true,
            provided_slug: 123,
            ..Default::default()
        }),
        should_remove_client_service,
        r#"Service({});"#,
        r#"_RNOS_CLIENT(123);"#
    );
}
