use swc_plugin::{ast::*, syntax_pos::DUMMY_SP};

/*

A bunch of ecmascript code builders

*/

pub fn void_zero () -> Expr {
  swc_plugin::ast::Expr::Unary(UnaryExpr {
    span: DUMMY_SP,
    op: UnaryOp::Void,
    arg: Box::new(Expr::Lit(Lit::Num(Number {
      raw: None,
      span: DUMMY_SP,
      value: 0.0
    })))
  })
}

pub fn void_decl () -> Decl {
  Decl::Var( VarDecl {
    span: DUMMY_SP,
    kind: VarDeclKind::Let,
    declare: false,
    decls: Vec::from([VarDeclarator {
      span: DUMMY_SP,
      definite: false,
      name: Pat::Ident(BindingIdent {
        id: Ident {
          span: DUMMY_SP,
          sym: JsWord::from("_RNOS_VOID"),
          optional: false
        },
        type_ann: None
      }),
      init: None
    }])
  })
}

pub fn id_literal (id: u64) -> ExprOrSpread {
  ExprOrSpread {
    spread: None,
    expr: Box::new(Expr::Lit(Lit::Num(Number {
      raw: None,
      span: DUMMY_SP,
      value: id as f64
    })))
  }
}

// transforms
// "Service(myobj)" => "_RNOS_CLIENT(15352409104929483000)"
pub fn rnos_client_call (id_literal: ExprOrSpread) -> Expr {
  swc_plugin::ast::Expr::Call(CallExpr {
    span: DUMMY_SP,
    callee: Callee::Expr(
      Box::new(
        Expr::Ident(
          Ident::from((JsWord::from("_RNOS_CLIENT"), DUMMY_SP.ctxt))))),
    args: Vec::from([id_literal]),
    type_args: None
  })
}

// transforms
// "Service(myobj)" => "Service._RNOS_SERVER(15352409104929483000, myobj)"
pub fn rnos_server_call(id_literal: ExprOrSpread,  service_expr: &CallExpr) -> Expr {
  if let Callee::Expr(callee) = &service_expr.callee {
    let member = swc_plugin::ast::Expr::Member(MemberExpr {
      span: DUMMY_SP,
      prop: MemberProp::Ident(Ident {
        
          span: DUMMY_SP,
          sym: JsWord::from("_RNOS_SERVER"),
          optional: false
        
      }),
      obj: callee.clone()
    });

    let mut args = service_expr.args.clone();

    args.insert(0, id_literal);

    return swc_plugin::ast::Expr::Call(CallExpr {
      span: DUMMY_SP,
      callee: Callee::Expr(Box::new(member)),
      args: args,
      type_args: None
    })
  }
  // we kinda know this won't happen?
  // todo: panic????
  println!("This is a problematic situation: Service was called incorrectly! {:?}", service_expr);
  return void_zero();
}

// let __rnos__main  = _RNOS_MAIN('slug', <this fn dec>)
pub fn main_declaration (expr: Box<Expr>, id: u64) -> Decl {
  Decl::Var(VarDecl {
    span: DUMMY_SP,
    kind: VarDeclKind::Let,
    declare: false,
    decls: Vec::from([VarDeclarator {
      span: DUMMY_SP,
      definite: false,
      name: Pat::Ident(BindingIdent {
        id: Ident {
          span: DUMMY_SP,
          sym: JsWord::from("__rnos__main"),// this symbol is not actually used
          optional: false
        },
        type_ann: None
      }),
      init: Some(Box::new(Expr::Call(CallExpr {
        span: DUMMY_SP,
        callee: Callee::Expr(Box::new(Expr::Ident(Ident {
          span: DUMMY_SP,
          sym: JsWord::from("_RNOS_MAIN"),
          optional: false
        }))),
        args: Vec::from([id_literal(id), ExprOrSpread {
            spread: None,
            expr: expr
          }]),
        type_args: None
      })))
    }])
  })
}

