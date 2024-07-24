import React from "react";
import { Card } from "@repo/ui/card";
import { Button } from "@repo/ui/button";

const HomePage: React.FC = () => {
  return (
    <div className="w-full h-screen flex flex-col justify-center items-center bg-gray-100">
      <h2 className="text-4xl font-bold mb-8">Teachable Machine</h2>
      <div className="flex flex-col items-center">
        <div className="text-2xl mb-4">New Project</div>
        <div className="flex flex-wrap justify-center gap-8 w-full p-4">
          <Card
            title="Image Project"
            description="Tech based on image from your files or web cam"
            coverImage="https://teachablemachine.withgoogle.com/assets/img/project-samples/image/sample1.jpg"
          >
            <Button type="link" text="Try it!" link="/image-classify" />
          </Card>
          <Card
            title="Pose Project"
            description="Teach based on images, from
                          files or your webcam."
            coverImage="https://teachablemachine.withgoogle.com/assets/img/project-samples/pose/sample2.jpg"
          >
            <Button type="link" text="Try it!" link="/pose-estimation" />
          </Card>
          <Card
            title="Audio Project"
            description="Tech based on image from your files or web cam"
            coverImage="https://via.placeholder.com/150"
          >
             <Button type="link" text="Try it!" link="/audio-classification" />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
