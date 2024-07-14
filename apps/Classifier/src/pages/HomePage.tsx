import React from 'react';
import { Card } from '@repo/ui/card';
import  {Button}  from '@repo/ui/button';


const HomePage: React.FC = () => {
    return (
        <div>
              <div className="w-full h-[100vh]">      <h2>Teachable Machine</h2>
      <div className="flex  mr-auto ml-auto  flex-col">
        <div className="text-2xl">New Project</div>
        <div className="flex justify-evenly w-full h-auto p-3"><Card title="Image Project" description="Tech based on image from your files or web cam" coverImage="https://via.placeholder.com/150" >
        <Button type="link" text="Try it!" link="/image-classify" />
          
        </Card>
        <Card title="Card Title" description="Card Description" coverImage="https://via.placeholder.com/150" >
          <p>Card Content</p>
        </Card>
        <Card title="Card Title" description="Tech based on image from your files or web cam" coverImage="https://via.placeholder.com/150" >
          <p>Card Content</p>
        </Card></div>
        
      </div></div>
        </div>
    );
};

export default HomePage;