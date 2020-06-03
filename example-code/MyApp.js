import Header from "components/header/Header";
// import Body from './components/body/Body';
import(/* webpackChunkName:"Overlays" */ "components/overlays/Overlays");

export Body from "./components/body/Body";

const { consoler } = require("./components/consoler");
consoler();

export default function createWithBsPrefix(
  prefix,
  { displayName = pascalCase(prefix), Component = "div", defaultProps } = {}
) {
  const BsComponent = React.forwardRef(
    // eslint-disable-next-line react/prop-types
    ({ className, bsPrefix, as: Tag = Component, ...props }, ref) => {
      const resolvedPrefix = useBootstrapPrefix(bsPrefix, prefix);
      return (
        <Tag
          ref={ref}
          className={classNames(className, resolvedPrefix)}
          {...props}
        />
      );
    }
  );
  BsComponent.defaultProps = defaultProps;
  BsComponent.displayName = displayName;
  return BsComponent;
}
