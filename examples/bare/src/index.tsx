/* @refresh reload */
import { render } from "solid-js/web";

const app = () => <div>Hello, world!</div>;

const root = document.getElementById("app") as HTMLDivElement;
render(app, root);
