import { Layout } from "@/components/layout/Layout";
import { Switch, Route } from "wouter";
import Home from "./Home";
import About from "./About";
import Services from "./Services";
import Programs from "./Programs";
import MediaNews from "./MediaNews";
import MediaEvents from "./MediaEvents";
import Partners from "./Partners";
import Register from "./Register";
import Contact from "./Contact";
import FindUs from "./FindUs";
import NotFound from "./not-found";

import AdminLogin from "./admin/Login";
import Dashboard from "./admin/Dashboard";
import Registrations from "./admin/Registrations";
import News from "./admin/News";
import AdminPartners from "./admin/Partners";
import Team from "./admin/Team";
import Stats from "./admin/Stats";
import Slides from "./admin/Slides";
import ContactInfoAdmin from "./admin/ContactInfo";

export default function AppRoutes() {
  return (
    <Switch>
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={Dashboard} />
      <Route path="/admin/registrations" component={Registrations} />
      <Route path="/admin/news" component={News} />
      <Route path="/admin/partners" component={AdminPartners} />
      <Route path="/admin/team" component={Team} />
      <Route path="/admin/stats" component={Stats} />
      <Route path="/admin/slides" component={Slides} />
      <Route path="/admin/contact-info" component={ContactInfoAdmin} />

      <Route path="/.*">
        <Layout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/about" component={About} />
            <Route path="/services" component={Services} />
            <Route path="/programs" component={Programs} />
            <Route path="/media/news" component={MediaNews} />
            <Route path="/media/events" component={MediaEvents} />
            <Route path="/partners-success" component={Partners} />
            <Route path="/register" component={Register} />
            <Route path="/contact" component={Contact} />
            <Route path="/find-us" component={FindUs} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
}
