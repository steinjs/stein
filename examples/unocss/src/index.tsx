/* @refresh reload */
import { render } from "solid-js/web";

const app = () => <div class="text-2xl text-red-500">Hello, world!</div>;

const root = document.getElementById("app") as HTMLDivElement;
render(app, root);
