
type Container = {
  _adagType: 'container';
}

type FormField = {
  _adagType: 'form';
}

type View = {
  _adagType: 'view';
}

type AsyncService = {
  _adagType: 'async-service';
}

type HttpService = {
  _adagType: 'http-service';
}

type StaticResource = {
  _adagType: 'static-resource'
}

type NodeType =
    Container
  | FormField
  | View
  | AsyncService
  | HttpService
  | StaticResource;


