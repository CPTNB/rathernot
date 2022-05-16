/// Produce a nested chain of if-lets and ifs from the patterns:
///
///     if_let_chain! {[
///         let Some(y) = x,
///         y.len() == 2,
///         let Some(z) = y,
///     ], {
///         block
///     }}
///
/// becomes
///
///     if let Some(y) = x {
///         if y.len() == 2 {
///             if let Some(z) = y {
///                 block
///             }
///         }
///     }
mod macros {
  #[macro_export]
  macro_rules! if_let_chain {
    ([let $pat:pat = $expr:expr, $($tt:tt)+], $block:block) => {
      if let $pat = $expr {
         if_let_chain!{ [$($tt)+], $block }
      }
    };
    ([let $pat:pat = $expr:expr], $block:block) => {
      if let $pat = $expr {
         $block
      }
    };
    ([let $pat:pat = $expr:expr,], $block:block) => {
      if let $pat = $expr {
         $block
      }
    };
    ([$expr:expr, $($tt:tt)+], $block:block) => {
      if $expr {
         if_let_chain!{ [$($tt)+], $block }
      }
    };
    ([$expr:expr], $block:block) => {
      if $expr {
         $block
      }
    };
    ([$expr:expr,], $block:block) => {
      if $expr {
         $block
      }
    };
  }
}
